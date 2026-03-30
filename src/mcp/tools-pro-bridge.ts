import path from 'path';
import fs from 'fs';
import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import { executePlan, type ExecutionPlan } from './executor';

/**
 * Native module interface — matches the Rust napi exports.
 */
interface NativeProModule {
  validateLicense(key: string): LicenseResult;
  getProToolDefinitions(): Array<{
    name: string;
    description: string;
    schema: Record<string, unknown>;
    actions: string[];
    edition: string;
  }>;
  processToolCall(toolName: string, args: unknown): ExecutionPlan;
  getProInfo(): {
    version: string;
    edition: string;
    nativeArch: string;
    nativeOs: string;
  };
}

export interface LicenseResult {
  valid: boolean;
  edition?: string;
  features?: string[];
  error?: string;
  expiry?: string;
  licensedTo?: string;
}

export interface ProLicenseStatus {
  proInstalled: boolean;
  licenseValid: boolean;
  edition: string;
  expiry?: string;
  licensedTo?: string;
  error?: string;
  features?: string[];
}

let nativeModule: NativeProModule | null = null;
let proEdition = 'community';
let cachedLicenseStatus: ProLicenseStatus = {
  proInstalled: false,
  licenseValid: false,
  edition: 'community',
};

/**
 * Try to load the native Pro module and register Pro tools.
 * Returns true if Pro tools were registered from the native module.
 * Returns false if the native module is not available (Community Edition).
 */
export function tryRegisterProTools(server: LocalToolServer, ctx: BridgeToolContext): boolean {
  nativeModule = loadNativeModule();
  if (!nativeModule) {
    cachedLicenseStatus = { proInstalled: false, licenseValid: false, edition: 'community' };
    return false;
  }

  cachedLicenseStatus.proInstalled = true;

  const license = validateProLicense(nativeModule);
  if (!license.valid) {
    const maskedKey = maskKey(readLicenseKey());
    console.log(`[MCP-Pro] No valid license${maskedKey ? ` (key: ${maskedKey})` : ''} — running as Community Edition`);
    cachedLicenseStatus = {
      proInstalled: true,
      licenseValid: false,
      edition: 'community',
      error: license.error,
    };
    return false;
  }

  proEdition = license.edition || 'pro';
  cachedLicenseStatus = {
    proInstalled: true,
    licenseValid: true,
    edition: proEdition,
    expiry: license.expiry,
    licensedTo: license.licensedTo,
    features: license.features,
  };
  console.log(`[MCP-Pro] License valid — edition: ${proEdition}`);

  const proInfo = nativeModule.getProInfo();
  console.log(`[MCP-Pro] Native core v${proInfo.version} (${proInfo.nativeOs}/${proInfo.nativeArch})`);

  const toolDefs = nativeModule.getProToolDefinitions();
  let registered = 0;

  for (const def of toolDefs) {
    if (def.edition === 'enterprise' && proEdition !== 'enterprise') continue;

    server.tool(
      def.name,
      def.description,
      def.schema,
      async (args: Record<string, unknown>) => {
        const plan = nativeModule!.processToolCall(def.name, args);
        return executePlan(ctx, plan);
      },
    );
    registered++;
  }

  console.log(`[MCP-Pro] Registered ${registered} Pro tools from native core`);
  return registered > 0;
}

export function getProEdition(): string {
  return proEdition;
}

export function isProLoaded(): boolean {
  return nativeModule !== null;
}

export function getProLicenseStatus(): ProLicenseStatus {
  return { ...cachedLicenseStatus };
}

/**
 * Save a license key to the .mcp-license file and re-validate.
 * Returns the new license status.
 */
export function saveLicenseKey(key: string): ProLicenseStatus {
  const keyPath = getLicenseFilePath();
  try {
    fs.writeFileSync(keyPath, key.trim(), 'utf-8');
  } catch (e) {
    return {
      proInstalled: cachedLicenseStatus.proInstalled,
      licenseValid: false,
      edition: 'community',
      error: `Failed to save license file: ${e instanceof Error ? e.message : e}`,
    };
  }

  if (!nativeModule) {
    return {
      proInstalled: false,
      licenseValid: false,
      edition: 'community',
      error: 'Native Pro module not installed',
    };
  }

  const result = nativeModule.validateLicense(key.trim());
  if (result.valid) {
    proEdition = result.edition || 'pro';
    cachedLicenseStatus = {
      proInstalled: true,
      licenseValid: true,
      edition: proEdition,
      expiry: result.expiry,
      licensedTo: result.licensedTo,
      features: result.features,
    };
  } else {
    cachedLicenseStatus = {
      proInstalled: true,
      licenseValid: false,
      edition: 'community',
      error: result.error,
    };
  }

  return { ...cachedLicenseStatus };
}

function loadNativeModule(): NativeProModule | null {
  const nativePath = path.join(__dirname, '..', '..', 'native', 'index.js');
  try {
    const mod = require(nativePath);
    if (!mod) return null;
    if (typeof mod.getProToolDefinitions !== 'function') {
      console.warn('[MCP-Pro] Native module loaded but missing expected exports');
      return null;
    }
    return mod as NativeProModule;
  } catch {
    return null;
  }
}

function validateProLicense(mod: NativeProModule): LicenseResult {
  const licenseKey = readLicenseKey();
  if (!licenseKey) return { valid: false, error: 'No license key provided' };

  try {
    return mod.validateLicense(licenseKey);
  } catch {
    return { valid: false, error: 'License validation failed' };
  }
}

function readLicenseKey(): string {
  const envKey = process.env.COCOS_MCP_LICENSE;
  if (envKey) return envKey;

  try {
    const keyPath = getLicenseFilePath();
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf-8').trim();
    }
  } catch { /* ignore */ }

  return '';
}

function getLicenseFilePath(): string {
  return path.join(__dirname, '..', '..', '.mcp-license');
}

function maskKey(key: string): string {
  if (!key) return '';
  return '****';
}
