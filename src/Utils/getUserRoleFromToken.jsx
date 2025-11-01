export default function getUserRoleFromToken() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  if (token.includes('.')) {
    try {
      const [, payload] = token.split('.');
      const data = JSON.parse(atob(payload));
      console.log("🧩 Token payload:", payload);
      const roleFields = [
        data.roles,
        data.role,
        data.roleName,
        data.Role,
        data.RoleName,
      ].filter(Boolean);

      let roles = [];
      const pushValue = (val) => {
        if (!val) return;
        // JSON array encoded as string
        if (typeof val === 'string' && val.trim().startsWith('[')) {
          try { JSON.parse(val).forEach((v) => pushValue(v)); return; } catch {}
        }
        if (Array.isArray(val)) { val.forEach((v) => pushValue(v)); return; }
        // Comma separated
        if (typeof val === 'string' && val.includes(',')) { val.split(',').forEach((v) => pushValue(v.trim())); return; }
        roles.push(val);
      };
      roleFields.forEach(pushValue);

      // Scan all claims keys (ASP.NET style claims; role can be under long URIs)
      Object.entries(data).forEach(([key, value]) => {
        const k = String(key).toLowerCase();
        if (k.includes('/role') || k.endsWith('/role') || k.includes('role')) {
          pushValue(value);
        }
      });

      roles = roles
        .filter(Boolean)
        .map((r) => (typeof r === 'string' ? r.toLowerCase() : `${r}`));

      if (roles.includes('administrator') || roles.includes('admin')) return 'admin';
      if (roles.includes('manager')) return 'manager';
      if (roles.includes('sales_staff') || roles.includes('sales')) return 'sales_staff';
      if (roles.includes('purchases_staff') || roles.includes('purchases')) return 'purchases_staff';
      if (roles.includes('warehouse_staff') || roles.includes('warehouse')) return 'warehouse_staff';
      if (roles.includes('accountant_staff') || roles.includes('accountant')) return 'accountant_staff';
      if (roles.includes('customer')) return 'customer';

      const roleId = data.roleId ?? data.RoleId ?? data.roleID;
      if (typeof roleId === 'number') {
        if (roleId === 6) return 'admin';
        if (roleId === 5) return 'manager';
        if (roleId === 0) return 'sales_staff';
        if (roleId === 1) return 'purchases_staff';
        if (roleId === 2) return 'warehouse_staff';
        if (roleId === 3) return 'accountant_staff';
        if (roleId === 4) return 'customer';
      }
      // As a last resort, try common policy names
      if (data?.aud === 'PmsClient' && data?.iss === 'PmsServer') {
        // default unknown staff to manager if not parseable (temporary safe fallback)
        console.warn('[Auth] Unable to parse role from token, falling back to landing');
      }
    } catch (e) {
      console.warn('[Auth] Failed to decode token payload', e);
    }
  }

  if (token.startsWith('demo-token-')) {
    const userId = token.split('-')[2];
    if (userId === '9') return 'admin';
    if (userId === '4') return 'manager';
    if (userId === '1' || userId === '6') return 'sales_staff';
    if (userId === '3') return 'purchases_staff';
    if (userId === '5') return 'warehouse_staff';
    return 'customer';
  }

  return null;
}


