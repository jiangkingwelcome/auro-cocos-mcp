# Aura - 敏感逻辑分析与安全设计建议

## 一、敏感逻辑识别

### 🔴 高敏感度（必须服务端化）

#### 1. 认证与授权

**当前实现**（客户端）:
```javascript
// .mcp-token 文件存储
const token = crypto.randomBytes(24).toString('hex');
fs.writeFileSync('.mcp-token', token);

// HTTP 请求验证
if (req.headers['x-mcp-token'] !== this.token) {
  return { statusCode: 401, body: 'Unauthorized' };
}
```

**问题**:
- ❌ Token 存储在本地文件，可被读取
- ❌ Token 验证逻辑在客户端，可被绕过
- ❌ 无法撤销已泄露的 Token
- ❌ 无法追踪 Token 使用情况

**建议设计**:
```javascript
// 服务端：Token 管理服务
class TokenService {
  async generateToken(userId, deviceId, scopes) {
    const token = {
      id: uuid(),
      userId,
      deviceId,
      scopes,
      expiresAt: Date.now() + 7 * 24 * 3600 * 1000, // 7天
      createdAt: Date.now(),
    };

    // 存储到数据库
    await db.tokens.insert(token);

    // 返回 JWT
    return jwt.sign(token, SECRET_KEY);
  }

  async validateToken(tokenString) {
    try {
      const payload = jwt.verify(tokenString, SECRET_KEY);

      // 检查是否被撤销
      const token = await db.tokens.findById(payload.id);
      if (!token || token.revoked) {
        return { valid: false, reason: 'revoked' };
      }

      // 检查过期
      if (Date.now() > payload.expiresAt) {
        return { valid: false, reason: 'expired' };
      }

      // 记录使用日志
      await db.tokenUsage.insert({
        tokenId: payload.id,
        timestamp: Date.now(),
        ip: req.ip,
      });

      return { valid: true, payload };
    } catch (err) {
      return { valid: false, reason: 'invalid' };
    }
  }

  async revokeToken(tokenId) {
    await db.tokens.update(tokenId, { revoked: true });
  }
}
```

#### 2. 许可证验证

**当前实现**: 无

**建议设计**:
```javascript
// 服务端：许可证服务
class LicenseService {
  async validateLicense(licenseKey, machineId) {
    // 1. 解密许可证
    const license = await this.decryptLicense(licenseKey);

    // 2. 验证签名
    if (!this.verifySignature(license)) {
      return { valid: false, reason: 'invalid_signature' };
    }

    // 3. 检查过期
    if (Date.now() > license.expiresAt) {
      return { valid: false, reason: 'expired' };
    }

    // 4. 检查机器绑定
    if (license.machineId && license.machineId !== machineId) {
      return { valid: false, reason: 'machine_mismatch' };
    }

    // 5. 检查使用次数
    const usage = await db.licenseUsage.count({ licenseKey });
    if (usage >= license.maxActivations) {
      return { valid: false, reason: 'max_activations_exceeded' };
    }

    // 6. 记录激活
    await db.licenseUsage.insert({
      licenseKey,
      machineId,
      timestamp: Date.now(),
    });

    return {
      valid: true,
      features: license.features,
      expiresAt: license.expiresAt,
    };
  }
}

// 客户端：定期验证
class LicenseClient {
  async checkLicense() {
    const machineId = this.getMachineId();
    const licenseKey = this.getLicenseKey();

    const response = await fetch('https://api.yourservice.com/validate', {
      method: 'POST',
      body: JSON.stringify({ licenseKey, machineId }),
    });

    const result = await response.json();

    if (!result.valid) {
      this.disableFeatures();
      throw new Error(`License invalid: ${result.reason}`);
    }

    this.enableFeatures(result.features);

    // 每小时验证一次
    setTimeout(() => this.checkLicense(), 3600000);
  }
}
```

#### 3. 付费功能解锁

**建议设计**:
```javascript
// 服务端：功能权限服务
class FeatureService {
  async checkFeatureAccess(userId, featureName) {
    const subscription = await db.subscriptions.findOne({
      userId,
      status: 'active',
      expiresAt: { $gt: Date.now() },
    });

    if (!subscription) {
      return { allowed: false, reason: 'no_subscription' };
    }

    const plan = await db.plans.findById(subscription.planId);

    if (!plan.features.includes(featureName)) {
      return {
        allowed: false,
        reason: 'feature_not_in_plan',
        upgradeUrl: `https://yoursite.com/upgrade?feature=${featureName}`,
      };
    }

    return { allowed: true };
  }
}

// 客户端：功能门控
class FeatureGate {
  async canUse(featureName) {
    const cached = this.cache.get(featureName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.allowed;
    }

    const result = await this.api.checkFeatureAccess(featureName);

    this.cache.set(featureName, {
      allowed: result.allowed,
      expiresAt: Date.now() + 300000, // 5分钟缓存
    });

    return result.allowed;
  }

  async useFeature(featureName, action) {
    if (!(await this.canUse(featureName))) {
      throw new Error(`Feature ${featureName} not available`);
    }

    return await action();
  }
}
```

### 🟡 中敏感度（建议服务端化）

#### 4. 使用统计与分析

**当前实现**: 无

**建议设计**:
```javascript
// 服务端：使用统计服务
class AnalyticsService {
  async trackEvent(userId, eventName, properties) {
    await db.events.insert({
      userId,
      eventName,
      properties,
      timestamp: Date.now(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // 实时分析
    await this.updateMetrics(userId, eventName);
  }

  async getUsageStats(userId) {
    const stats = await db.events.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$eventName',
          count: { $sum: 1 },
          lastUsed: { $max: '$timestamp' },
        },
      },
    ]);

    return stats;
  }

  // 检测异常使用
  async detectAnomalies(userId) {
    const recentEvents = await db.events.find({
      userId,
      timestamp: { $gt: Date.now() - 3600000 }, // 最近1小时
    });

    // 检测频率异常
    if (recentEvents.length > 1000) {
      await this.flagUser(userId, 'high_frequency');
    }

    // 检测多设备登录
    const uniqueIps = new Set(recentEvents.map(e => e.ip));
    if (uniqueIps.size > 5) {
      await this.flagUser(userId, 'multiple_devices');
    }
  }
}
```

#### 5. 速率限制

**当前实现**（客户端）:
```javascript
// 简单的内存速率限制
class RateLimiter {
  constructor(maxRequests = 1200, windowMs = 60000) {
    this.requests = new Map();
  }

  check(clientId) {
    const now = Date.now();
    const requests = this.requests.get(clientId) || [];
    const recentRequests = requests.filter(t => now - t < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);
    return true;
  }
}
```

**问题**:
- ❌ 重启后速率限制重置
- ❌ 无法跨实例共享
- ❌ 可被客户端绕过

**建议设计**:
```javascript
// 服务端：分布式速率限制
class DistributedRateLimiter {
  constructor(redis) {
    this.redis = redis;
  }

  async check(userId, action, limits) {
    const key = `ratelimit:${userId}:${action}`;

    // 使用 Redis 滑动窗口
    const now = Date.now();
    const windowStart = now - limits.windowMs;

    // 清理过期记录
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // 获取当前窗口内的请求数
    const count = await this.redis.zcard(key);

    if (count >= limits.maxRequests) {
      const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = parseInt(oldestRequest[1]) + limits.windowMs;

      return {
        allowed: false,
        retryAfter: Math.ceil((resetTime - now) / 1000),
        limit: limits.maxRequests,
        remaining: 0,
      };
    }

    // 记录新请求
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, Math.ceil(limits.windowMs / 1000));

    return {
      allowed: true,
      limit: limits.maxRequests,
      remaining: limits.maxRequests - count - 1,
    };
  }
}

// 多层速率限制
const rateLimits = {
  free: {
    'scene_operation': { maxRequests: 100, windowMs: 3600000 }, // 100/小时
    'asset_operation': { maxRequests: 50, windowMs: 3600000 },
  },
  pro: {
    'scene_operation': { maxRequests: 1000, windowMs: 3600000 },
    'asset_operation': { maxRequests: 500, windowMs: 3600000 },
  },
};
```

#### 6. 敏感操作审计

**建议设计**:
```javascript
// 服务端：审计日志服务
class AuditService {
  async log(event) {
    const auditLog = {
      id: uuid(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      result: event.result,
      ip: event.ip,
      userAgent: event.userAgent,
      timestamp: Date.now(),
      metadata: event.metadata,
    };

    // 写入数据库
    await db.auditLogs.insert(auditLog);

    // 敏感操作告警
    if (this.isSensitiveAction(event.action)) {
      await this.sendAlert(auditLog);
    }

    // 合规性要求：不可变日志
    await this.writeToImmutableStorage(auditLog);
  }

  isSensitiveAction(action) {
    return [
      'destroy_node',
      'clear_children',
      'delete_asset',
      'modify_license',
    ].includes(action);
  }

  async getAuditTrail(userId, filters) {
    return await db.auditLogs.find({
      userId,
      ...filters,
    }).sort({ timestamp: -1 });
  }
}
```

### 🟢 低敏感度（可保留客户端）

#### 7. 场景查询操作

**当前实现**: 客户端直接执行

**理由**:
- ✅ 只读操作，不修改数据
- ✅ 需要实时性，服务端会增加延迟
- ✅ 数据量大，服务端传输成本高

**安全增强**:
```javascript
// 添加查询限制
class SceneQueryHandler {
  async query(action, params) {
    // 限制返回数据量
    const maxNodes = params.maxNodes || 500;
    if (maxNodes > 1000) {
      throw new Error('maxNodes cannot exceed 1000');
    }

    // 限制查询深度
    const maxDepth = params.maxDepth || 10;
    if (maxDepth > 20) {
      throw new Error('maxDepth cannot exceed 20');
    }

    // 执行查询
    const result = await this.executeQuery(action, params);

    // 脱敏处理
    return this.sanitize(result);
  }

  sanitize(data) {
    // 移除敏感信息
    if (data.internalData) delete data.internalData;
    if (data.debugInfo) delete data.debugInfo;
    return data;
  }
}
```

## 二、安全架构设计

### 方案 A：混合架构（推荐）

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Aura Plugin (本地)                                   │   │
│  │  - 场景查询（只读）                                   │   │
│  │  - 场景操作（需授权）                                 │   │
│  │  - 资源操作（需授权）                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ HTTPS                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    授权服务器                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  认证服务                                             │   │
│  │  - Token 生成与验证                                   │   │
│  │  - 许可证验证                                         │   │
│  │  - 会话管理                                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  权限服务                                             │   │
│  │  - 功能权限检查                                       │   │
│  │  - 速率限制                                           │   │
│  │  - 配额管理                                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  审计服务                                             │   │
│  │  - 操作日志                                           │   │
│  │  - 使用统计                                           │   │
│  │  - 异常检测                                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 实现示例

```javascript
// 客户端：授权客户端
class AuthClient {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  async authenticate(licenseKey, machineId) {
    const response = await fetch(`${this.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey, machineId }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    this.token = data.token;
    this.tokenExpiresAt = data.expiresAt;

    // 定期刷新
    this.scheduleRefresh();

    return data;
  }

  async checkPermission(action) {
    if (!this.token || Date.now() > this.tokenExpiresAt) {
      throw new Error('Token expired, please re-authenticate');
    }

    const response = await fetch(`${this.apiUrl}/auth/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ action }),
    });

    const result = await response.json();
    return result.allowed;
  }

  scheduleRefresh() {
    const refreshTime = this.tokenExpiresAt - Date.now() - 300000; // 提前5分钟
    setTimeout(() => this.refreshToken(), refreshTime);
  }

  async refreshToken() {
    const response = await fetch(`${this.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
    });

    const data = await response.json();
    this.token = data.token;
    this.tokenExpiresAt = data.expiresAt;

    this.scheduleRefresh();
  }
}

// 客户端：受保护的操作
class ProtectedSceneOperation {
  constructor(authClient) {
    this.authClient = authClient;
  }

  async execute(action, params) {
    // 1. 检查权限
    const allowed = await this.authClient.checkPermission(action);
    if (!allowed) {
      throw new Error(`Permission denied for action: ${action}`);
    }

    // 2. 执行操作
    const result = await this.executeLocal(action, params);

    // 3. 上报使用情况（异步，不阻塞）
    this.reportUsage(action, result).catch(console.error);

    return result;
  }

  async executeLocal(action, params) {
    // 本地执行逻辑
    return await Editor.Message.request('scene', 'execute-operation', {
      action,
      params,
    });
  }

  async reportUsage(action, result) {
    await fetch(`${this.authClient.apiUrl}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authClient.token}`,
      },
      body: JSON.stringify({
        action,
        success: !result.error,
        timestamp: Date.now(),
      }),
    });
  }
}
```

### 方案 B：完全服务端化（最安全）

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Thin Client (仅 UI)                                 │   │
│  │  - 发送命令到服务端                                   │   │
│  │  - 接收结果并显示                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ WebSocket                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    云端服务                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cocos Editor 实例池                                  │   │
│  │  - 动态分配编辑器实例                                 │   │
│  │  - 执行所有操作                                       │   │
│  │  - 返回结果                                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**优点**:
- ✅ 最高安全性
- ✅ 完全控制
- ✅ 易于更新

**缺点**:
- ❌ 延迟高
- ❌ 成本高
- ❌ 需要网络连接

## 三、实施建议

### 阶段 1：基础安全（立即实施）

1. **添加许可证验证**
```javascript
// 启动时验证
async function startup() {
  const license = await validateLicense();
  if (!license.valid) {
    showLicenseDialog();
    return;
  }

  startBridge(license.features);
}
```

2. **添加操作审计**
```javascript
// 记录所有危险操作
function auditLog(action, params, result) {
  const log = {
    action,
    params: sanitize(params),
    result: result.success,
    timestamp: Date.now(),
  };

  fs.appendFileSync('audit.log', JSON.stringify(log) + '\n');
}
```

3. **添加速率限制**
```javascript
// 防止滥用
const limiter = new RateLimiter({
  destroy_node: { max: 100, window: 3600000 },
  delete_asset: { max: 50, window: 3600000 },
});
```

### 阶段 2：服务端集成（3个月内）

1. **搭建授权服务器**
   - 使用 Node.js + Express
   - 数据库：PostgreSQL
   - 缓存：Redis

2. **实现认证流程**
   - JWT Token
   - 许可证验证
   - 会话管理

3. **实现权限检查**
   - 功能权限
   - 速率限制
   - 配额管理

### 阶段 3：高级功能（6个月内）

1. **使用分析**
   - 用户行为追踪
   - 功能使用统计
   - 异常检测

2. **动态配置**
   - 远程功能开关
   - A/B 测试
   - 灰度发布

3. **安全监控**
   - 实时告警
   - 威胁检测
   - 自动封禁

## 四、成本效益分析

### 方案对比

| 方案 | 安全性 | 成本 | 延迟 | 实施难度 |
|------|--------|------|------|---------|
| 纯客户端 | ⭐⭐ | 低 | 低 | 低 |
| 混合架构 | ⭐⭐⭐⭐ | 中 | 中 | 中 |
| 完全服务端 | ⭐⭐⭐⭐⭐ | 高 | 高 | 高 |

### 推荐方案：混合架构

**理由**:
1. ✅ 平衡安全性和性能
2. ✅ 成本可控
3. ✅ 实施难度适中
4. ✅ 可逐步迁移

**预估成本**（月）:
- 服务器：$50-100（AWS/阿里云）
- 数据库：$20-50（RDS）
- CDN：$10-30
- **总计：$80-180/月**

## 五、总结

### 必须服务端化的逻辑

1. ✅ **认证与授权** - Token 生成、验证、撤销
2. ✅ **许可证验证** - 防止盗版和滥用
3. ✅ **付费功能解锁** - 订阅管理、功能门控
4. ✅ **速率限制** - 防止滥用和 DDoS
5. ✅ **使用统计** - 用户行为分析、异常检测
6. ✅ **审计日志** - 合规性要求、安全追溯

### 可保留客户端的逻辑

1. ✅ **场景查询** - 只读操作，实时性要求高
2. ✅ **本地缓存** - 减少网络请求
3. ✅ **UI 交互** - 用户体验优先

### 关键原则

1. **最小权限原则** - 客户端只能做必要的操作
2. **零信任原则** - 不信任任何客户端输入
3. **深度防御** - 多层安全措施
4. **可审计性** - 所有操作可追溯
5. **渐进增强** - 逐步提升安全性

---

**下一步行动**:
1. 立即实施基础安全措施（许可证验证、审计日志）
2. 3个月内搭建授权服务器
3. 6个月内完成混合架构迁移
