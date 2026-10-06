const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relativePath, mocks = {}, globals = {}) {
  const source = readFileSync(join(__dirname, '..', relativePath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const exports = {};
  const context = vm.createContext({ exports, require: (name) => {
    assert.ok(name in mocks, `Unexpected import ${name}`);
    return mocks[name];
  }, File, Blob, FormData, URL, CustomEvent, Date, ...globals });
  new vm.Script(outputText, { filename: relativePath }).runInContext(context);
  return exports;
}

function authSetup(response, failure) {
  const events = [];
  const requests = [];
  const apiClient = {
    url: (path) => `http://localhost:5000${path}`,
    post: async (path, form) => {
      requests.push({ path, file: form.get('file') });
      if (failure) throw failure;
      return response;
    },
    delete: async () => response,
  };
  const compressed = new File([Buffer.from([8, 9])], 'avatar.webp', { type: 'image/webp' });
  const { authService } = load('src/features/auth/services/authService.ts', {
    '@/shared/api/apiClient': { apiClient, API_BASE_URL: 'http://localhost:5000' },
    '@/shared/utils/compressAvatarImage': { compressAvatarImage: async () => compressed },
  }, { window: { dispatchEvent: (event) => events.push(event) } });
  return { authService, events, requests };
}

test('100 successful uploads have distinct cache versions even within the same millisecond', async () => {
  const setup = authSetup({ message: 'ok', avatarUrl: 'https://lh3.googleusercontent.com/d/stable-id' });
  const file = new File(['image'], 'same.jpg', { type: 'image/jpeg' });
  const versions = new Set();
  for (let index = 0; index < 100; index++) {
    const response = await setup.authService.uploadAvatar(file);
    const url = new URL(response.avatarUrl);
    assert.equal(url.pathname, '/d/stable-id');
    versions.add(url.searchParams.get('t'));
  }
  assert.equal(versions.size, 100);
  assert.equal(setup.requests.length, 100);
  assert.equal(setup.events.length, 100);
  const first = setup.authService.getDisplayAvatarUrl('https://lh3.googleusercontent.com/d/stable-id', undefined, 1000);
  const second = setup.authService.getDisplayAvatarUrl('https://lh3.googleusercontent.com/d/stable-id', undefined, 1000);
  assert.notEqual(first, second);
});

test('a stable URL loaded after logout/login gets a fresh display version', () => {
  const setup = authSetup(null);
  const stableUrl = 'https://lh3.googleusercontent.com/d/stable-id';
  const firstSession = setup.authService.getDisplayAvatarUrl(stableUrl, 'user@gmail.com');
  const nextSession = setup.authService.getDisplayAvatarUrl(stableUrl, 'user@gmail.com');
  assert.notEqual(firstSession, nextSession);
  assert.equal(setup.authService.getDisplayAvatarUrl(nextSession), nextSession, 'ordinary rerenders preserve the current version');
});

test('AuthContext restores a versioned latest avatar after login and page reload', async () => {
  const actual = authSetup(null).authService;
  const serverUser = { id: 1, email: 'user@gmail.com', name: 'User', role: 'USER',
    avatarUrl: 'https://lh3.googleusercontent.com/d/latest-avatar-id' };
  let contextUser = null;
  const effects = [];
  const hooks = {
    createContext: () => ({ Provider: 'provider' }),
    useCallback: (callback) => callback,
    useContext: () => {},
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, (next) => {
      const value = typeof next === 'function' ? next(contextUser) : next;
      if (typeof value !== 'boolean') contextUser = value;
    }],
    useEffect: (effect) => effects.push(effect),
  };
  const jsx = (type, props) => ({ type, props });
  const { AuthProvider } = load('src/features/auth/context/AuthContext.tsx', {
    react: { ...hooks, default: hooks },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '../services/authService': { authService: {
      getDisplayAvatarUrl: actual.getDisplayAvatarUrl,
      login: async () => ({ success: true, user: serverUser }),
      logout: async () => {},
      prepareSessionCheck: () => {},
      getUserInfo: async () => serverUser,
      clearSessionState: () => {},
    } },
  }, { window: { addEventListener: () => {}, removeEventListener: () => {} } });
  const tree = AuthProvider({ children: null });
  const context = tree.props.value;
  await context.login({ email: serverUser.email, password: 'test', rememberMe: false });
  const first = contextUser.avatar;
  assert.equal(new URL(first).pathname, '/d/latest-avatar-id');
  assert.ok(new URL(first).searchParams.has('t'));
  await context.logout();
  assert.equal(contextUser, null);
  await context.login({ email: serverUser.email, password: 'test', rememberMe: false });
  assert.notEqual(contextUser.avatar, first);
  effects[0](); // /api/me rehydration on a fresh app load.
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(new URL(contextUser.avatar).pathname, '/d/latest-avatar-id');
  assert.ok(new URL(contextUser.avatar).searchParams.has('t'));
});

function profileSetup() {
  const state = [];
  const refs = [];
  let stateIndex = 0;
  let refIndex = 0;
  let calls = 0;
  let fail = false;
  const hooks = {
    useState: (initial) => {
      const index = stateIndex++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (next) => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    },
    useRef: (initial) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
    useEffect: () => {},
  };
  const jsx = (type, props) => ({ type, props });
  const { UserProfileModal } = load('src/features/profile/components/UserProfileModal.tsx', {
    react: { ...hooks, default: hooks },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-router-dom': { useNavigate: () => () => {} },
    '@/shared/hooks/useLanguage': { useLanguage: () => ({ t: (key, options) => options?.defaultValue ?? key }) },
    '@/features/auth/context/AuthContext': { useAuth: () => ({
      user: { id: 1, email: 'user@gmail.com', name: 'User', role: 'USER' }, isAdmin: false, logout: async () => {},
    }) },
    '@/features/auth/services/authService': { authService: {
      uploadAvatar: async () => {
        calls++;
        if (fail) throw new Error('Drive update failed');
        return { message: 'ok', avatarUrl: `https://lh3.googleusercontent.com/d/stable-id?t=${calls}` };
      },
    } },
    '@/shared/api/apiClient': { getApiErrorMessage: (error) => error.message },
    '@/shared/components/ui': { Input: 'input', PasswordInput: 'input' },
    'lucide-react': new Proxy({}, { get: () => 'icon' }),
    'framer-motion': { motion: new Proxy({}, { get: (_, name) => `motion.${name}` }), AnimatePresence: 'presence' },
  });
  function findInput(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'input' && node.props.type === 'file') return node;
    const children = node.props?.children;
    for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
      const found = findInput(child);
      if (found) return found;
    }
    return null;
  }
  return {
    state, refs, calls: () => calls, fail: () => { fail = true; },
    render: () => {
      stateIndex = 0;
      refIndex = 0;
      return findInput(UserProfileModal({ isOpen: true, onClose: () => {}, onSwitchAccount: () => {} }));
    },
  };
}

test('the actual profile handler resets file input after success/failure and lets the same file be uploaded again', async () => {
  const setup = profileSetup();
  const file = new File(['image'], 'same.jpg', { type: 'image/jpeg' });
  const inputElement = { value: '', files: [file] };
  for (let index = 0; index < 5; index++) {
    const input = setup.render();
    input.props.ref.current = inputElement;
    assert.equal(inputElement.value, '', 'the picker must not retain the previous selection');
    inputElement.value = 'C:\\fakepath\\same.jpg';
    await input.props.onChange({ target: inputElement });
    assert.equal(inputElement.value, '');
    assert.equal(setup.calls(), index + 1);
    assert.equal(setup.refs[1].current, false, 'upload lock is released for the next selection');
  }
  const latest = 'https://lh3.googleusercontent.com/d/stable-id?t=5';
  assert.ok(setup.state.includes(latest));
  setup.fail();
  const input = setup.render();
  inputElement.value = 'C:\\fakepath\\same.jpg';
  await input.props.onChange({ target: inputElement });
  assert.equal(inputElement.value, '');
  assert.equal(setup.refs[1].current, false);
  assert.ok(setup.state.includes(latest), 'failure rolls back to the last successful avatar');
  assert.ok(setup.state.includes('Drive update failed'));
});

test('upload publishes a cache-busted Drive URL and sends actual compressed MIME/bytes', async () => {
  const setup = authSetup({ message: 'ok', avatarUrl: 'https://lh3.googleusercontent.com/d/stable-id?t=old' });
  const result = await setup.authService.uploadAvatar(new File(['input'], 'input.jpg', { type: 'image/jpeg' }));
  const url = new URL(result.avatarUrl);
  assert.equal(url.pathname, '/d/stable-id');
  assert.match(url.searchParams.get('t'), /^\d+$/);
  assert.equal(url.searchParams.getAll('t').length, 1);
  assert.equal(setup.events.length, 1);
  assert.equal(setup.events[0].detail.avatarUrl, result.avatarUrl);
  assert.equal(setup.requests[0].file.type, 'image/webp');
  assert.deepEqual(Buffer.from(await setup.requests[0].file.arrayBuffer()), Buffer.from([8, 9]));
});

for (const response of [null, { success: false, message: 'Drive update failed', avatarUrl: 'https://lh3.googleusercontent.com/d/id' }, { message: 'missing URL' }]) {
  test(`invalid/failed upload does not publish a successful avatar update: ${JSON.stringify(response)}`, async () => {
    const setup = authSetup(response);
    await assert.rejects(() => setup.authService.uploadAvatar(new File(['input'], 'input.jpg')));
    assert.equal(setup.events.length, 0);
  });
}

test('HTTP/storage rejection leaves auth avatar unchanged', async () => {
  const setup = authSetup(null, new Error('HTTP 502'));
  await assert.rejects(() => setup.authService.uploadAvatar(new File(['input'], 'input.jpg')), /502/);
  assert.equal(setup.events.length, 0);
});

test('delete failure does not clear the auth avatar', async () => {
  const setup = authSetup({ success: false, message: 'Drive unavailable' });
  await assert.rejects(() => setup.authService.deleteAvatar(), /Drive unavailable/);
  assert.equal(setup.events.length, 0);
});

test('compression keeps encoder fallback MIME/extension and dimensions at 1024', async () => {
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: () => {} }),
    toBlob: (callback) => callback(new Blob(['png-output'], { type: 'image/png' })) };
  let closed = false;
  const { compressAvatarImage } = load('src/shared/utils/compressAvatarImage.ts', {}, {
    createImageBitmap: async () => ({ width: 2048, height: 1024, close: () => { closed = true; } }),
    document: { createElement: () => canvas },
  });
  const result = await compressAvatarImage(new File(['tiny'], 'original.jpg', { type: 'image/jpeg' }));
  assert.equal(canvas.width, 1024);
  assert.equal(canvas.height, 512);
  assert.equal(result.type, 'image/png');
  assert.equal(result.name, 'original.png');
  assert.equal(closed, true);
});

test('compression uses WebP quality 0.82 and preserves animated GIFs', async () => {
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: () => {} }),
    toBlob: (callback, type, quality) => {
      assert.equal(type, 'image/webp');
      assert.equal(quality, 0.82);
      callback(new Blob(['webp'], { type: 'image/webp' }));
    } };
  const { compressAvatarImage } = load('src/shared/utils/compressAvatarImage.ts', {}, {
    createImageBitmap: async () => ({ width: 2000, height: 2000, close: () => {} }),
    document: { createElement: () => canvas },
  });
  const result = await compressAvatarImage(new File(['jpeg-content'], 'avatar.jpg', { type: 'image/jpeg' }));
  assert.equal(result.type, 'image/webp');
  assert.equal(result.name, 'avatar.webp');
  const gif = new File(['animated'], 'avatar.gif', { type: 'image/gif' });
  assert.equal(await compressAvatarImage(gif), gif);
});
