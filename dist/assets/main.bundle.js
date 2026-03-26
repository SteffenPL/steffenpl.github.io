(() => {
  // node_modules/alpinejs/dist/module.esm.js
  var flushPending = false;
  var flushing = false;
  var queue = [];
  function scheduler(callback) {
    queueJob(callback);
  }
  function queueJob(job) {
    if (!queue.includes(job))
      queue.push(job);
    queueFlush();
  }
  function dequeueJob(job) {
    let index = queue.indexOf(job);
    if (index !== -1)
      queue.splice(index, 1);
  }
  function queueFlush() {
    if (!flushing && !flushPending) {
      flushPending = true;
      queueMicrotask(flushJobs);
    }
  }
  function flushJobs() {
    flushPending = false;
    flushing = true;
    for (let i = 0; i < queue.length; i++) {
      queue[i]();
    }
    queue.length = 0;
    flushing = false;
  }
  var reactive;
  var effect;
  var release;
  var raw;
  var shouldSchedule = true;
  function disableEffectScheduling(callback) {
    shouldSchedule = false;
    callback();
    shouldSchedule = true;
  }
  function setReactivityEngine(engine) {
    reactive = engine.reactive;
    release = engine.release;
    effect = (callback) => engine.effect(callback, { scheduler: (task) => {
      if (shouldSchedule) {
        scheduler(task);
      } else {
        task();
      }
    } });
    raw = engine.raw;
  }
  function overrideEffect(override) {
    effect = override;
  }
  function elementBoundEffect(el) {
    let cleanup2 = () => {
    };
    let wrappedEffect = (callback) => {
      let effectReference = effect(callback);
      if (!el._x_effects) {
        el._x_effects = /* @__PURE__ */ new Set();
        el._x_runEffects = () => {
          el._x_effects.forEach((i) => i());
        };
      }
      el._x_effects.add(effectReference);
      cleanup2 = () => {
        if (effectReference === void 0)
          return;
        el._x_effects.delete(effectReference);
        release(effectReference);
      };
      return effectReference;
    };
    return [wrappedEffect, () => {
      cleanup2();
    }];
  }
  var onAttributeAddeds = [];
  var onElRemoveds = [];
  var onElAddeds = [];
  function onElAdded(callback) {
    onElAddeds.push(callback);
  }
  function onElRemoved(el, callback) {
    if (typeof callback === "function") {
      if (!el._x_cleanups)
        el._x_cleanups = [];
      el._x_cleanups.push(callback);
    } else {
      callback = el;
      onElRemoveds.push(callback);
    }
  }
  function onAttributesAdded(callback) {
    onAttributeAddeds.push(callback);
  }
  function onAttributeRemoved(el, name, callback) {
    if (!el._x_attributeCleanups)
      el._x_attributeCleanups = {};
    if (!el._x_attributeCleanups[name])
      el._x_attributeCleanups[name] = [];
    el._x_attributeCleanups[name].push(callback);
  }
  function cleanupAttributes(el, names) {
    if (!el._x_attributeCleanups)
      return;
    Object.entries(el._x_attributeCleanups).forEach(([name, value]) => {
      if (names === void 0 || names.includes(name)) {
        value.forEach((i) => i());
        delete el._x_attributeCleanups[name];
      }
    });
  }
  var observer = new MutationObserver(onMutate);
  var currentlyObserving = false;
  function startObservingMutations() {
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
    currentlyObserving = true;
  }
  function stopObservingMutations() {
    flushObserver();
    observer.disconnect();
    currentlyObserving = false;
  }
  var recordQueue = [];
  var willProcessRecordQueue = false;
  function flushObserver() {
    recordQueue = recordQueue.concat(observer.takeRecords());
    if (recordQueue.length && !willProcessRecordQueue) {
      willProcessRecordQueue = true;
      queueMicrotask(() => {
        processRecordQueue();
        willProcessRecordQueue = false;
      });
    }
  }
  function processRecordQueue() {
    onMutate(recordQueue);
    recordQueue.length = 0;
  }
  function mutateDom(callback) {
    if (!currentlyObserving)
      return callback();
    stopObservingMutations();
    let result = callback();
    startObservingMutations();
    return result;
  }
  var isCollecting = false;
  var deferredMutations = [];
  function deferMutations() {
    isCollecting = true;
  }
  function flushAndStopDeferringMutations() {
    isCollecting = false;
    onMutate(deferredMutations);
    deferredMutations = [];
  }
  function onMutate(mutations) {
    if (isCollecting) {
      deferredMutations = deferredMutations.concat(mutations);
      return;
    }
    let addedNodes = [];
    let removedNodes = [];
    let addedAttributes = /* @__PURE__ */ new Map();
    let removedAttributes = /* @__PURE__ */ new Map();
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].target._x_ignoreMutationObserver)
        continue;
      if (mutations[i].type === "childList") {
        mutations[i].addedNodes.forEach((node) => node.nodeType === 1 && addedNodes.push(node));
        mutations[i].removedNodes.forEach((node) => node.nodeType === 1 && removedNodes.push(node));
      }
      if (mutations[i].type === "attributes") {
        let el = mutations[i].target;
        let name = mutations[i].attributeName;
        let oldValue = mutations[i].oldValue;
        let add2 = () => {
          if (!addedAttributes.has(el))
            addedAttributes.set(el, []);
          addedAttributes.get(el).push({ name, value: el.getAttribute(name) });
        };
        let remove = () => {
          if (!removedAttributes.has(el))
            removedAttributes.set(el, []);
          removedAttributes.get(el).push(name);
        };
        if (el.hasAttribute(name) && oldValue === null) {
          add2();
        } else if (el.hasAttribute(name)) {
          remove();
          add2();
        } else {
          remove();
        }
      }
    }
    removedAttributes.forEach((attrs, el) => {
      cleanupAttributes(el, attrs);
    });
    addedAttributes.forEach((attrs, el) => {
      onAttributeAddeds.forEach((i) => i(el, attrs));
    });
    for (let node of removedNodes) {
      if (addedNodes.includes(node))
        continue;
      onElRemoveds.forEach((i) => i(node));
      if (node._x_cleanups) {
        while (node._x_cleanups.length)
          node._x_cleanups.pop()();
      }
    }
    addedNodes.forEach((node) => {
      node._x_ignoreSelf = true;
      node._x_ignore = true;
    });
    for (let node of addedNodes) {
      if (removedNodes.includes(node))
        continue;
      if (!node.isConnected)
        continue;
      delete node._x_ignoreSelf;
      delete node._x_ignore;
      onElAddeds.forEach((i) => i(node));
      node._x_ignore = true;
      node._x_ignoreSelf = true;
    }
    addedNodes.forEach((node) => {
      delete node._x_ignoreSelf;
      delete node._x_ignore;
    });
    addedNodes = null;
    removedNodes = null;
    addedAttributes = null;
    removedAttributes = null;
  }
  function scope(node) {
    return mergeProxies(closestDataStack(node));
  }
  function addScopeToNode(node, data2, referenceNode) {
    node._x_dataStack = [data2, ...closestDataStack(referenceNode || node)];
    return () => {
      node._x_dataStack = node._x_dataStack.filter((i) => i !== data2);
    };
  }
  function refreshScope(element, scope2) {
    let existingScope = element._x_dataStack[0];
    Object.entries(scope2).forEach(([key, value]) => {
      existingScope[key] = value;
    });
  }
  function closestDataStack(node) {
    if (node._x_dataStack)
      return node._x_dataStack;
    if (typeof ShadowRoot === "function" && node instanceof ShadowRoot) {
      return closestDataStack(node.host);
    }
    if (!node.parentNode) {
      return [];
    }
    return closestDataStack(node.parentNode);
  }
  function mergeProxies(objects) {
    let thisProxy = new Proxy({}, {
      ownKeys: () => {
        return Array.from(new Set(objects.flatMap((i) => Object.keys(i))));
      },
      has: (target, name) => {
        return objects.some((obj) => obj.hasOwnProperty(name));
      },
      get: (target, name) => {
        return (objects.find((obj) => {
          if (obj.hasOwnProperty(name)) {
            let descriptor = Object.getOwnPropertyDescriptor(obj, name);
            if (descriptor.get && descriptor.get._x_alreadyBound || descriptor.set && descriptor.set._x_alreadyBound) {
              return true;
            }
            if ((descriptor.get || descriptor.set) && descriptor.enumerable) {
              let getter = descriptor.get;
              let setter = descriptor.set;
              let property = descriptor;
              getter = getter && getter.bind(thisProxy);
              setter = setter && setter.bind(thisProxy);
              if (getter)
                getter._x_alreadyBound = true;
              if (setter)
                setter._x_alreadyBound = true;
              Object.defineProperty(obj, name, {
                ...property,
                get: getter,
                set: setter
              });
            }
            return true;
          }
          return false;
        }) || {})[name];
      },
      set: (target, name, value) => {
        let closestObjectWithKey = objects.find((obj) => obj.hasOwnProperty(name));
        if (closestObjectWithKey) {
          closestObjectWithKey[name] = value;
        } else {
          objects[objects.length - 1][name] = value;
        }
        return true;
      }
    });
    return thisProxy;
  }
  function initInterceptors(data2) {
    let isObject2 = (val) => typeof val === "object" && !Array.isArray(val) && val !== null;
    let recurse = (obj, basePath = "") => {
      Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach(([key, { value, enumerable }]) => {
        if (enumerable === false || value === void 0)
          return;
        let path = basePath === "" ? key : `${basePath}.${key}`;
        if (typeof value === "object" && value !== null && value._x_interceptor) {
          obj[key] = value.initialize(data2, path, key);
        } else {
          if (isObject2(value) && value !== obj && !(value instanceof Element)) {
            recurse(value, path);
          }
        }
      });
    };
    return recurse(data2);
  }
  function interceptor(callback, mutateObj = () => {
  }) {
    let obj = {
      initialValue: void 0,
      _x_interceptor: true,
      initialize(data2, path, key) {
        return callback(this.initialValue, () => get(data2, path), (value) => set(data2, path, value), path, key);
      }
    };
    mutateObj(obj);
    return (initialValue) => {
      if (typeof initialValue === "object" && initialValue !== null && initialValue._x_interceptor) {
        let initialize = obj.initialize.bind(obj);
        obj.initialize = (data2, path, key) => {
          let innerValue = initialValue.initialize(data2, path, key);
          obj.initialValue = innerValue;
          return initialize(data2, path, key);
        };
      } else {
        obj.initialValue = initialValue;
      }
      return obj;
    };
  }
  function get(obj, path) {
    return path.split(".").reduce((carry, segment) => carry[segment], obj);
  }
  function set(obj, path, value) {
    if (typeof path === "string")
      path = path.split(".");
    if (path.length === 1)
      obj[path[0]] = value;
    else if (path.length === 0)
      throw error;
    else {
      if (obj[path[0]])
        return set(obj[path[0]], path.slice(1), value);
      else {
        obj[path[0]] = {};
        return set(obj[path[0]], path.slice(1), value);
      }
    }
  }
  var magics = {};
  function magic(name, callback) {
    magics[name] = callback;
  }
  function injectMagics(obj, el) {
    Object.entries(magics).forEach(([name, callback]) => {
      Object.defineProperty(obj, `$${name}`, {
        get() {
          let [utilities, cleanup2] = getElementBoundUtilities(el);
          utilities = { interceptor, ...utilities };
          onElRemoved(el, cleanup2);
          return callback(el, utilities);
        },
        enumerable: false
      });
    });
    return obj;
  }
  function tryCatch(el, expression, callback, ...args) {
    try {
      return callback(...args);
    } catch (e) {
      handleError(e, el, expression);
    }
  }
  function handleError(error2, el, expression = void 0) {
    Object.assign(error2, { el, expression });
    console.warn(`Alpine Expression Error: ${error2.message}

${expression ? 'Expression: "' + expression + '"\n\n' : ""}`, el);
    setTimeout(() => {
      throw error2;
    }, 0);
  }
  var shouldAutoEvaluateFunctions = true;
  function dontAutoEvaluateFunctions(callback) {
    let cache = shouldAutoEvaluateFunctions;
    shouldAutoEvaluateFunctions = false;
    callback();
    shouldAutoEvaluateFunctions = cache;
  }
  function evaluate(el, expression, extras = {}) {
    let result;
    evaluateLater(el, expression)((value) => result = value, extras);
    return result;
  }
  function evaluateLater(...args) {
    return theEvaluatorFunction(...args);
  }
  var theEvaluatorFunction = normalEvaluator;
  function setEvaluator(newEvaluator) {
    theEvaluatorFunction = newEvaluator;
  }
  function normalEvaluator(el, expression) {
    let overriddenMagics = {};
    injectMagics(overriddenMagics, el);
    let dataStack = [overriddenMagics, ...closestDataStack(el)];
    if (typeof expression === "function") {
      return generateEvaluatorFromFunction(dataStack, expression);
    }
    let evaluator = generateEvaluatorFromString(dataStack, expression, el);
    return tryCatch.bind(null, el, expression, evaluator);
  }
  function generateEvaluatorFromFunction(dataStack, func) {
    return (receiver = () => {
    }, { scope: scope2 = {}, params = [] } = {}) => {
      let result = func.apply(mergeProxies([scope2, ...dataStack]), params);
      runIfTypeOfFunction(receiver, result);
    };
  }
  var evaluatorMemo = {};
  function generateFunctionFromString(expression, el) {
    if (evaluatorMemo[expression]) {
      return evaluatorMemo[expression];
    }
    let AsyncFunction = Object.getPrototypeOf(async function() {
    }).constructor;
    let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression) || /^(let|const)\s/.test(expression) ? `(async()=>{ ${expression} })()` : expression;
    const safeAsyncFunction = () => {
      try {
        return new AsyncFunction(["__self", "scope"], `with (scope) { __self.result = ${rightSideSafeExpression} }; __self.finished = true; return __self.result;`);
      } catch (error2) {
        handleError(error2, el, expression);
        return Promise.resolve();
      }
    };
    let func = safeAsyncFunction();
    evaluatorMemo[expression] = func;
    return func;
  }
  function generateEvaluatorFromString(dataStack, expression, el) {
    let func = generateFunctionFromString(expression, el);
    return (receiver = () => {
    }, { scope: scope2 = {}, params = [] } = {}) => {
      func.result = void 0;
      func.finished = false;
      let completeScope = mergeProxies([scope2, ...dataStack]);
      if (typeof func === "function") {
        let promise = func(func, completeScope).catch((error2) => handleError(error2, el, expression));
        if (func.finished) {
          runIfTypeOfFunction(receiver, func.result, completeScope, params, el);
          func.result = void 0;
        } else {
          promise.then((result) => {
            runIfTypeOfFunction(receiver, result, completeScope, params, el);
          }).catch((error2) => handleError(error2, el, expression)).finally(() => func.result = void 0);
        }
      }
    };
  }
  function runIfTypeOfFunction(receiver, value, scope2, params, el) {
    if (shouldAutoEvaluateFunctions && typeof value === "function") {
      let result = value.apply(scope2, params);
      if (result instanceof Promise) {
        result.then((i) => runIfTypeOfFunction(receiver, i, scope2, params)).catch((error2) => handleError(error2, el, value));
      } else {
        receiver(result);
      }
    } else if (typeof value === "object" && value instanceof Promise) {
      value.then((i) => receiver(i));
    } else {
      receiver(value);
    }
  }
  var prefixAsString = "x-";
  function prefix(subject = "") {
    return prefixAsString + subject;
  }
  function setPrefix(newPrefix) {
    prefixAsString = newPrefix;
  }
  var directiveHandlers = {};
  function directive(name, callback) {
    directiveHandlers[name] = callback;
    return {
      before(directive2) {
        if (!directiveHandlers[directive2]) {
          console.warn("Cannot find directive `${directive}`. `${name}` will use the default order of execution");
          return;
        }
        const pos = directiveOrder.indexOf(directive2) ?? directiveOrder.indexOf("DEFAULT");
        if (pos >= 0) {
          directiveOrder.splice(pos, 0, name);
        }
      }
    };
  }
  function directives(el, attributes, originalAttributeOverride) {
    attributes = Array.from(attributes);
    if (el._x_virtualDirectives) {
      let vAttributes = Object.entries(el._x_virtualDirectives).map(([name, value]) => ({ name, value }));
      let staticAttributes = attributesOnly(vAttributes);
      vAttributes = vAttributes.map((attribute) => {
        if (staticAttributes.find((attr) => attr.name === attribute.name)) {
          return {
            name: `x-bind:${attribute.name}`,
            value: `"${attribute.value}"`
          };
        }
        return attribute;
      });
      attributes = attributes.concat(vAttributes);
    }
    let transformedAttributeMap = {};
    let directives2 = attributes.map(toTransformedAttributes((newName, oldName) => transformedAttributeMap[newName] = oldName)).filter(outNonAlpineAttributes).map(toParsedDirectives(transformedAttributeMap, originalAttributeOverride)).sort(byPriority);
    return directives2.map((directive2) => {
      return getDirectiveHandler(el, directive2);
    });
  }
  function attributesOnly(attributes) {
    return Array.from(attributes).map(toTransformedAttributes()).filter((attr) => !outNonAlpineAttributes(attr));
  }
  var isDeferringHandlers = false;
  var directiveHandlerStacks = /* @__PURE__ */ new Map();
  var currentHandlerStackKey = Symbol();
  function deferHandlingDirectives(callback) {
    isDeferringHandlers = true;
    let key = Symbol();
    currentHandlerStackKey = key;
    directiveHandlerStacks.set(key, []);
    let flushHandlers = () => {
      while (directiveHandlerStacks.get(key).length)
        directiveHandlerStacks.get(key).shift()();
      directiveHandlerStacks.delete(key);
    };
    let stopDeferring = () => {
      isDeferringHandlers = false;
      flushHandlers();
    };
    callback(flushHandlers);
    stopDeferring();
  }
  function getElementBoundUtilities(el) {
    let cleanups = [];
    let cleanup2 = (callback) => cleanups.push(callback);
    let [effect32, cleanupEffect] = elementBoundEffect(el);
    cleanups.push(cleanupEffect);
    let utilities = {
      Alpine: alpine_default,
      effect: effect32,
      cleanup: cleanup2,
      evaluateLater: evaluateLater.bind(evaluateLater, el),
      evaluate: evaluate.bind(evaluate, el)
    };
    let doCleanup = () => cleanups.forEach((i) => i());
    return [utilities, doCleanup];
  }
  function getDirectiveHandler(el, directive2) {
    let noop = () => {
    };
    let handler3 = directiveHandlers[directive2.type] || noop;
    let [utilities, cleanup2] = getElementBoundUtilities(el);
    onAttributeRemoved(el, directive2.original, cleanup2);
    let fullHandler = () => {
      if (el._x_ignore || el._x_ignoreSelf)
        return;
      handler3.inline && handler3.inline(el, directive2, utilities);
      handler3 = handler3.bind(handler3, el, directive2, utilities);
      isDeferringHandlers ? directiveHandlerStacks.get(currentHandlerStackKey).push(handler3) : handler3();
    };
    fullHandler.runCleanups = cleanup2;
    return fullHandler;
  }
  var startingWith = (subject, replacement) => ({ name, value }) => {
    if (name.startsWith(subject))
      name = name.replace(subject, replacement);
    return { name, value };
  };
  var into = (i) => i;
  function toTransformedAttributes(callback = () => {
  }) {
    return ({ name, value }) => {
      let { name: newName, value: newValue } = attributeTransformers.reduce((carry, transform) => {
        return transform(carry);
      }, { name, value });
      if (newName !== name)
        callback(newName, name);
      return { name: newName, value: newValue };
    };
  }
  var attributeTransformers = [];
  function mapAttributes(callback) {
    attributeTransformers.push(callback);
  }
  function outNonAlpineAttributes({ name }) {
    return alpineAttributeRegex().test(name);
  }
  var alpineAttributeRegex = () => new RegExp(`^${prefixAsString}([^:^.]+)\\b`);
  function toParsedDirectives(transformedAttributeMap, originalAttributeOverride) {
    return ({ name, value }) => {
      let typeMatch = name.match(alpineAttributeRegex());
      let valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/);
      let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
      let original = originalAttributeOverride || transformedAttributeMap[name] || name;
      return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map((i) => i.replace(".", "")),
        expression: value,
        original
      };
    };
  }
  var DEFAULT = "DEFAULT";
  var directiveOrder = [
    "ignore",
    "ref",
    "data",
    "id",
    "radio",
    "tabs",
    "switch",
    "disclosure",
    "menu",
    "listbox",
    "combobox",
    "bind",
    "init",
    "for",
    "mask",
    "model",
    "modelable",
    "transition",
    "show",
    "if",
    DEFAULT,
    "teleport"
  ];
  function byPriority(a, b) {
    let typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
    let typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;
    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
  }
  function dispatch(el, name, detail = {}) {
    el.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true
    }));
  }
  function walk(el, callback) {
    if (typeof ShadowRoot === "function" && el instanceof ShadowRoot) {
      Array.from(el.children).forEach((el2) => walk(el2, callback));
      return;
    }
    let skip = false;
    callback(el, () => skip = true);
    if (skip)
      return;
    let node = el.firstElementChild;
    while (node) {
      walk(node, callback, false);
      node = node.nextElementSibling;
    }
  }
  function warn(message, ...args) {
    console.warn(`Alpine Warning: ${message}`, ...args);
  }
  function start() {
    if (!document.body)
      warn("Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?");
    dispatch(document, "alpine:init");
    dispatch(document, "alpine:initializing");
    startObservingMutations();
    onElAdded((el) => initTree(el, walk));
    onElRemoved((el) => destroyTree(el));
    onAttributesAdded((el, attrs) => {
      directives(el, attrs).forEach((handle) => handle());
    });
    let outNestedComponents = (el) => !closestRoot(el.parentElement, true);
    Array.from(document.querySelectorAll(allSelectors())).filter(outNestedComponents).forEach((el) => {
      initTree(el);
    });
    dispatch(document, "alpine:initialized");
  }
  var rootSelectorCallbacks = [];
  var initSelectorCallbacks = [];
  function rootSelectors() {
    return rootSelectorCallbacks.map((fn2) => fn2());
  }
  function allSelectors() {
    return rootSelectorCallbacks.concat(initSelectorCallbacks).map((fn2) => fn2());
  }
  function addRootSelector(selectorCallback) {
    rootSelectorCallbacks.push(selectorCallback);
  }
  function addInitSelector(selectorCallback) {
    initSelectorCallbacks.push(selectorCallback);
  }
  function closestRoot(el, includeInitSelectors = false) {
    return findClosest(el, (element) => {
      const selectors = includeInitSelectors ? allSelectors() : rootSelectors();
      if (selectors.some((selector) => element.matches(selector)))
        return true;
    });
  }
  function findClosest(el, callback) {
    if (!el)
      return;
    if (callback(el))
      return el;
    if (el._x_teleportBack)
      el = el._x_teleportBack;
    if (!el.parentElement)
      return;
    return findClosest(el.parentElement, callback);
  }
  function isRoot(el) {
    return rootSelectors().some((selector) => el.matches(selector));
  }
  var initInterceptors2 = [];
  function interceptInit(callback) {
    initInterceptors2.push(callback);
  }
  function initTree(el, walker = walk, intercept = () => {
  }) {
    deferHandlingDirectives(() => {
      walker(el, (el2, skip) => {
        intercept(el2, skip);
        initInterceptors2.forEach((i) => i(el2, skip));
        directives(el2, el2.attributes).forEach((handle) => handle());
        el2._x_ignore && skip();
      });
    });
  }
  function destroyTree(root) {
    walk(root, (el) => cleanupAttributes(el));
  }
  var tickStack = [];
  var isHolding = false;
  function nextTick(callback = () => {
  }) {
    queueMicrotask(() => {
      isHolding || setTimeout(() => {
        releaseNextTicks();
      });
    });
    return new Promise((res) => {
      tickStack.push(() => {
        callback();
        res();
      });
    });
  }
  function releaseNextTicks() {
    isHolding = false;
    while (tickStack.length)
      tickStack.shift()();
  }
  function holdNextTicks() {
    isHolding = true;
  }
  function setClasses(el, value) {
    if (Array.isArray(value)) {
      return setClassesFromString(el, value.join(" "));
    } else if (typeof value === "object" && value !== null) {
      return setClassesFromObject(el, value);
    } else if (typeof value === "function") {
      return setClasses(el, value());
    }
    return setClassesFromString(el, value);
  }
  function setClassesFromString(el, classString) {
    let split = (classString2) => classString2.split(" ").filter(Boolean);
    let missingClasses = (classString2) => classString2.split(" ").filter((i) => !el.classList.contains(i)).filter(Boolean);
    let addClassesAndReturnUndo = (classes) => {
      el.classList.add(...classes);
      return () => {
        el.classList.remove(...classes);
      };
    };
    classString = classString === true ? classString = "" : classString || "";
    return addClassesAndReturnUndo(missingClasses(classString));
  }
  function setClassesFromObject(el, classObject) {
    let split = (classString) => classString.split(" ").filter(Boolean);
    let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean);
    let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => !bool ? split(classString) : false).filter(Boolean);
    let added = [];
    let removed = [];
    forRemove.forEach((i) => {
      if (el.classList.contains(i)) {
        el.classList.remove(i);
        removed.push(i);
      }
    });
    forAdd.forEach((i) => {
      if (!el.classList.contains(i)) {
        el.classList.add(i);
        added.push(i);
      }
    });
    return () => {
      removed.forEach((i) => el.classList.add(i));
      added.forEach((i) => el.classList.remove(i));
    };
  }
  function setStyles(el, value) {
    if (typeof value === "object" && value !== null) {
      return setStylesFromObject(el, value);
    }
    return setStylesFromString(el, value);
  }
  function setStylesFromObject(el, value) {
    let previousStyles = {};
    Object.entries(value).forEach(([key, value2]) => {
      previousStyles[key] = el.style[key];
      if (!key.startsWith("--")) {
        key = kebabCase(key);
      }
      el.style.setProperty(key, value2);
    });
    setTimeout(() => {
      if (el.style.length === 0) {
        el.removeAttribute("style");
      }
    });
    return () => {
      setStyles(el, previousStyles);
    };
  }
  function setStylesFromString(el, value) {
    let cache = el.getAttribute("style", value);
    el.setAttribute("style", value);
    return () => {
      el.setAttribute("style", cache || "");
    };
  }
  function kebabCase(subject) {
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  function once(callback, fallback = () => {
  }) {
    let called = false;
    return function() {
      if (!called) {
        called = true;
        callback.apply(this, arguments);
      } else {
        fallback.apply(this, arguments);
      }
    };
  }
  directive("transition", (el, { value, modifiers, expression }, { evaluate: evaluate2 }) => {
    if (typeof expression === "function")
      expression = evaluate2(expression);
    if (!expression) {
      registerTransitionsFromHelper(el, modifiers, value);
    } else {
      registerTransitionsFromClassString(el, expression, value);
    }
  });
  function registerTransitionsFromClassString(el, classString, stage) {
    registerTransitionObject(el, setClasses, "");
    let directiveStorageMap = {
      enter: (classes) => {
        el._x_transition.enter.during = classes;
      },
      "enter-start": (classes) => {
        el._x_transition.enter.start = classes;
      },
      "enter-end": (classes) => {
        el._x_transition.enter.end = classes;
      },
      leave: (classes) => {
        el._x_transition.leave.during = classes;
      },
      "leave-start": (classes) => {
        el._x_transition.leave.start = classes;
      },
      "leave-end": (classes) => {
        el._x_transition.leave.end = classes;
      }
    };
    directiveStorageMap[stage](classString);
  }
  function registerTransitionsFromHelper(el, modifiers, stage) {
    registerTransitionObject(el, setStyles);
    let doesntSpecify = !modifiers.includes("in") && !modifiers.includes("out") && !stage;
    let transitioningIn = doesntSpecify || modifiers.includes("in") || ["enter"].includes(stage);
    let transitioningOut = doesntSpecify || modifiers.includes("out") || ["leave"].includes(stage);
    if (modifiers.includes("in") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index < modifiers.indexOf("out"));
    }
    if (modifiers.includes("out") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index > modifiers.indexOf("out"));
    }
    let wantsAll = !modifiers.includes("opacity") && !modifiers.includes("scale");
    let wantsOpacity = wantsAll || modifiers.includes("opacity");
    let wantsScale = wantsAll || modifiers.includes("scale");
    let opacityValue = wantsOpacity ? 0 : 1;
    let scaleValue = wantsScale ? modifierValue(modifiers, "scale", 95) / 100 : 1;
    let delay = modifierValue(modifiers, "delay", 0);
    let origin = modifierValue(modifiers, "origin", "center");
    let property = "opacity, transform";
    let durationIn = modifierValue(modifiers, "duration", 150) / 1e3;
    let durationOut = modifierValue(modifiers, "duration", 75) / 1e3;
    let easing = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
    if (transitioningIn) {
      el._x_transition.enter.during = {
        transformOrigin: origin,
        transitionDelay: delay,
        transitionProperty: property,
        transitionDuration: `${durationIn}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.enter.start = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
      el._x_transition.enter.end = {
        opacity: 1,
        transform: `scale(1)`
      };
    }
    if (transitioningOut) {
      el._x_transition.leave.during = {
        transformOrigin: origin,
        transitionDelay: delay,
        transitionProperty: property,
        transitionDuration: `${durationOut}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.leave.start = {
        opacity: 1,
        transform: `scale(1)`
      };
      el._x_transition.leave.end = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
    }
  }
  function registerTransitionObject(el, setFunction, defaultValue = {}) {
    if (!el._x_transition)
      el._x_transition = {
        enter: { during: defaultValue, start: defaultValue, end: defaultValue },
        leave: { during: defaultValue, start: defaultValue, end: defaultValue },
        in(before = () => {
        }, after = () => {
        }) {
          transition(el, setFunction, {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end
          }, before, after);
        },
        out(before = () => {
        }, after = () => {
        }) {
          transition(el, setFunction, {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end
          }, before, after);
        }
      };
  }
  window.Element.prototype._x_toggleAndCascadeWithTransitions = function(el, value, show, hide2) {
    const nextTick2 = document.visibilityState === "visible" ? requestAnimationFrame : setTimeout;
    let clickAwayCompatibleShow = () => nextTick2(show);
    if (value) {
      if (el._x_transition && (el._x_transition.enter || el._x_transition.leave)) {
        el._x_transition.enter && (Object.entries(el._x_transition.enter.during).length || Object.entries(el._x_transition.enter.start).length || Object.entries(el._x_transition.enter.end).length) ? el._x_transition.in(show) : clickAwayCompatibleShow();
      } else {
        el._x_transition ? el._x_transition.in(show) : clickAwayCompatibleShow();
      }
      return;
    }
    el._x_hidePromise = el._x_transition ? new Promise((resolve, reject) => {
      el._x_transition.out(() => {
      }, () => resolve(hide2));
      el._x_transitioning.beforeCancel(() => reject({ isFromCancelledTransition: true }));
    }) : Promise.resolve(hide2);
    queueMicrotask(() => {
      let closest = closestHide(el);
      if (closest) {
        if (!closest._x_hideChildren)
          closest._x_hideChildren = [];
        closest._x_hideChildren.push(el);
      } else {
        nextTick2(() => {
          let hideAfterChildren = (el2) => {
            let carry = Promise.all([
              el2._x_hidePromise,
              ...(el2._x_hideChildren || []).map(hideAfterChildren)
            ]).then(([i]) => i());
            delete el2._x_hidePromise;
            delete el2._x_hideChildren;
            return carry;
          };
          hideAfterChildren(el).catch((e) => {
            if (!e.isFromCancelledTransition)
              throw e;
          });
        });
      }
    });
  };
  function closestHide(el) {
    let parent = el.parentNode;
    if (!parent)
      return;
    return parent._x_hidePromise ? parent : closestHide(parent);
  }
  function transition(el, setFunction, { during, start: start22, end: end2 } = {}, before = () => {
  }, after = () => {
  }) {
    if (el._x_transitioning)
      el._x_transitioning.cancel();
    if (Object.keys(during).length === 0 && Object.keys(start22).length === 0 && Object.keys(end2).length === 0) {
      before();
      after();
      return;
    }
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = setFunction(el, start22);
      },
      during() {
        undoDuring = setFunction(el, during);
      },
      before,
      end() {
        undoStart();
        undoEnd = setFunction(el, end2);
      },
      after,
      cleanup() {
        undoDuring();
        undoEnd();
      }
    });
  }
  function performTransition(el, stages) {
    let interrupted, reachedBefore, reachedEnd;
    let finish = once(() => {
      mutateDom(() => {
        interrupted = true;
        if (!reachedBefore)
          stages.before();
        if (!reachedEnd) {
          stages.end();
          releaseNextTicks();
        }
        stages.after();
        if (el.isConnected)
          stages.cleanup();
        delete el._x_transitioning;
      });
    });
    el._x_transitioning = {
      beforeCancels: [],
      beforeCancel(callback) {
        this.beforeCancels.push(callback);
      },
      cancel: once(function() {
        while (this.beforeCancels.length) {
          this.beforeCancels.shift()();
        }
        ;
        finish();
      }),
      finish
    };
    mutateDom(() => {
      stages.start();
      stages.during();
    });
    holdNextTicks();
    requestAnimationFrame(() => {
      if (interrupted)
        return;
      let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, "").replace("s", "")) * 1e3;
      let delay = Number(getComputedStyle(el).transitionDelay.replace(/,.*/, "").replace("s", "")) * 1e3;
      if (duration === 0)
        duration = Number(getComputedStyle(el).animationDuration.replace("s", "")) * 1e3;
      mutateDom(() => {
        stages.before();
      });
      reachedBefore = true;
      requestAnimationFrame(() => {
        if (interrupted)
          return;
        mutateDom(() => {
          stages.end();
        });
        releaseNextTicks();
        setTimeout(el._x_transitioning.finish, duration + delay);
        reachedEnd = true;
      });
    });
  }
  function modifierValue(modifiers, key, fallback) {
    if (modifiers.indexOf(key) === -1)
      return fallback;
    const rawValue = modifiers[modifiers.indexOf(key) + 1];
    if (!rawValue)
      return fallback;
    if (key === "scale") {
      if (isNaN(rawValue))
        return fallback;
    }
    if (key === "duration") {
      let match = rawValue.match(/([0-9]+)ms/);
      if (match)
        return match[1];
    }
    if (key === "origin") {
      if (["top", "right", "left", "center", "bottom"].includes(modifiers[modifiers.indexOf(key) + 2])) {
        return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(" ");
      }
    }
    return rawValue;
  }
  var isCloning = false;
  function skipDuringClone(callback, fallback = () => {
  }) {
    return (...args) => isCloning ? fallback(...args) : callback(...args);
  }
  function onlyDuringClone(callback) {
    return (...args) => isCloning && callback(...args);
  }
  function clone(oldEl, newEl) {
    if (!newEl._x_dataStack)
      newEl._x_dataStack = oldEl._x_dataStack;
    isCloning = true;
    dontRegisterReactiveSideEffects(() => {
      cloneTree(newEl);
    });
    isCloning = false;
  }
  function cloneTree(el) {
    let hasRunThroughFirstEl = false;
    let shallowWalker = (el2, callback) => {
      walk(el2, (el3, skip) => {
        if (hasRunThroughFirstEl && isRoot(el3))
          return skip();
        hasRunThroughFirstEl = true;
        callback(el3, skip);
      });
    };
    initTree(el, shallowWalker);
  }
  function dontRegisterReactiveSideEffects(callback) {
    let cache = effect;
    overrideEffect((callback2, el) => {
      let storedEffect = cache(callback2);
      release(storedEffect);
      return () => {
      };
    });
    callback();
    overrideEffect(cache);
  }
  function bind(el, name, value, modifiers = []) {
    if (!el._x_bindings)
      el._x_bindings = reactive({});
    el._x_bindings[name] = value;
    name = modifiers.includes("camel") ? camelCase(name) : name;
    switch (name) {
      case "value":
        bindInputValue(el, value);
        break;
      case "style":
        bindStyles(el, value);
        break;
      case "class":
        bindClasses(el, value);
        break;
      default:
        bindAttribute(el, name, value);
        break;
    }
  }
  function bindInputValue(el, value) {
    if (el.type === "radio") {
      if (el.attributes.value === void 0) {
        el.value = value;
      }
      if (window.fromModel) {
        el.checked = checkedAttrLooseCompare(el.value, value);
      }
    } else if (el.type === "checkbox") {
      if (Number.isInteger(value)) {
        el.value = value;
      } else if (!Number.isInteger(value) && !Array.isArray(value) && typeof value !== "boolean" && ![null, void 0].includes(value)) {
        el.value = String(value);
      } else {
        if (Array.isArray(value)) {
          el.checked = value.some((val) => checkedAttrLooseCompare(val, el.value));
        } else {
          el.checked = !!value;
        }
      }
    } else if (el.tagName === "SELECT") {
      updateSelect(el, value);
    } else {
      if (el.value === value)
        return;
      el.value = value;
    }
  }
  function bindClasses(el, value) {
    if (el._x_undoAddedClasses)
      el._x_undoAddedClasses();
    el._x_undoAddedClasses = setClasses(el, value);
  }
  function bindStyles(el, value) {
    if (el._x_undoAddedStyles)
      el._x_undoAddedStyles();
    el._x_undoAddedStyles = setStyles(el, value);
  }
  function bindAttribute(el, name, value) {
    if ([null, void 0, false].includes(value) && attributeShouldntBePreservedIfFalsy(name)) {
      el.removeAttribute(name);
    } else {
      if (isBooleanAttr(name))
        value = name;
      setIfChanged(el, name, value);
    }
  }
  function setIfChanged(el, attrName, value) {
    if (el.getAttribute(attrName) != value) {
      el.setAttribute(attrName, value);
    }
  }
  function updateSelect(el, value) {
    const arrayWrappedValue = [].concat(value).map((value2) => {
      return value2 + "";
    });
    Array.from(el.options).forEach((option) => {
      option.selected = arrayWrappedValue.includes(option.value);
    });
  }
  function camelCase(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function checkedAttrLooseCompare(valueA, valueB) {
    return valueA == valueB;
  }
  function isBooleanAttr(attrName) {
    const booleanAttributes = [
      "disabled",
      "checked",
      "required",
      "readonly",
      "hidden",
      "open",
      "selected",
      "autofocus",
      "itemscope",
      "multiple",
      "novalidate",
      "allowfullscreen",
      "allowpaymentrequest",
      "formnovalidate",
      "autoplay",
      "controls",
      "loop",
      "muted",
      "playsinline",
      "default",
      "ismap",
      "reversed",
      "async",
      "defer",
      "nomodule"
    ];
    return booleanAttributes.includes(attrName);
  }
  function attributeShouldntBePreservedIfFalsy(name) {
    return !["aria-pressed", "aria-checked", "aria-expanded", "aria-selected"].includes(name);
  }
  function getBinding(el, name, fallback) {
    if (el._x_bindings && el._x_bindings[name] !== void 0)
      return el._x_bindings[name];
    let attr = el.getAttribute(name);
    if (attr === null)
      return typeof fallback === "function" ? fallback() : fallback;
    if (attr === "")
      return true;
    if (isBooleanAttr(name)) {
      return !![name, "true"].includes(attr);
    }
    return attr;
  }
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      let context = this, args = arguments;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  function plugin(callback) {
    callback(alpine_default);
  }
  var stores = {};
  var isReactive = false;
  function store(name, value) {
    if (!isReactive) {
      stores = reactive(stores);
      isReactive = true;
    }
    if (value === void 0) {
      return stores[name];
    }
    stores[name] = value;
    if (typeof value === "object" && value !== null && value.hasOwnProperty("init") && typeof value.init === "function") {
      stores[name].init();
    }
    initInterceptors(stores[name]);
  }
  function getStores() {
    return stores;
  }
  var binds = {};
  function bind2(name, bindings) {
    let getBindings = typeof bindings !== "function" ? () => bindings : bindings;
    if (name instanceof Element) {
      applyBindingsObject(name, getBindings());
    } else {
      binds[name] = getBindings;
    }
  }
  function injectBindingProviders(obj) {
    Object.entries(binds).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback(...args);
          };
        }
      });
    });
    return obj;
  }
  function applyBindingsObject(el, obj, original) {
    let cleanupRunners = [];
    while (cleanupRunners.length)
      cleanupRunners.pop()();
    let attributes = Object.entries(obj).map(([name, value]) => ({ name, value }));
    let staticAttributes = attributesOnly(attributes);
    attributes = attributes.map((attribute) => {
      if (staticAttributes.find((attr) => attr.name === attribute.name)) {
        return {
          name: `x-bind:${attribute.name}`,
          value: `"${attribute.value}"`
        };
      }
      return attribute;
    });
    directives(el, attributes, original).map((handle) => {
      cleanupRunners.push(handle.runCleanups);
      handle();
    });
  }
  var datas = {};
  function data(name, callback) {
    datas[name] = callback;
  }
  function injectDataProviders(obj, context) {
    Object.entries(datas).forEach(([name, callback]) => {
      Object.defineProperty(obj, name, {
        get() {
          return (...args) => {
            return callback.bind(context)(...args);
          };
        },
        enumerable: false
      });
    });
    return obj;
  }
  var Alpine = {
    get reactive() {
      return reactive;
    },
    get release() {
      return release;
    },
    get effect() {
      return effect;
    },
    get raw() {
      return raw;
    },
    version: "3.11.1",
    flushAndStopDeferringMutations,
    dontAutoEvaluateFunctions,
    disableEffectScheduling,
    startObservingMutations,
    stopObservingMutations,
    setReactivityEngine,
    closestDataStack,
    skipDuringClone,
    onlyDuringClone,
    addRootSelector,
    addInitSelector,
    addScopeToNode,
    deferMutations,
    mapAttributes,
    evaluateLater,
    interceptInit,
    setEvaluator,
    mergeProxies,
    findClosest,
    closestRoot,
    destroyTree,
    interceptor,
    transition,
    setStyles,
    mutateDom,
    directive,
    throttle,
    debounce,
    evaluate,
    initTree,
    nextTick,
    prefixed: prefix,
    prefix: setPrefix,
    plugin,
    magic,
    store,
    start,
    clone,
    bound: getBinding,
    $data: scope,
    walk,
    data,
    bind: bind2
  };
  var alpine_default = Alpine;
  function makeMap(str, expectsLowerCase) {
    const map = /* @__PURE__ */ Object.create(null);
    const list = str.split(",");
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
  }
  var specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
  var isBooleanAttr2 = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
  var EMPTY_OBJ = true ? Object.freeze({}) : {};
  var EMPTY_ARR = true ? Object.freeze([]) : [];
  var extend = Object.assign;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key) => hasOwnProperty.call(val, key);
  var isArray = Array.isArray;
  var isMap = (val) => toTypeString(val) === "[object Map]";
  var isString = (val) => typeof val === "string";
  var isSymbol = (val) => typeof val === "symbol";
  var isObject = (val) => val !== null && typeof val === "object";
  var objectToString = Object.prototype.toString;
  var toTypeString = (value) => objectToString.call(value);
  var toRawType = (value) => {
    return toTypeString(value).slice(8, -1);
  };
  var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
  var cacheStringFunction = (fn2) => {
    const cache = /* @__PURE__ */ Object.create(null);
    return (str) => {
      const hit = cache[str];
      return hit || (cache[str] = fn2(str));
    };
  };
  var camelizeRE = /-(\w)/g;
  var camelize = cacheStringFunction((str) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
  });
  var hyphenateRE = /\B([A-Z])/g;
  var hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
  var capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
  var toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
  var hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);
  var targetMap = /* @__PURE__ */ new WeakMap();
  var effectStack = [];
  var activeEffect;
  var ITERATE_KEY = Symbol(true ? "iterate" : "");
  var MAP_KEY_ITERATE_KEY = Symbol(true ? "Map key iterate" : "");
  function isEffect(fn2) {
    return fn2 && fn2._isEffect === true;
  }
  function effect2(fn2, options = EMPTY_OBJ) {
    if (isEffect(fn2)) {
      fn2 = fn2.raw;
    }
    const effect32 = createReactiveEffect(fn2, options);
    if (!options.lazy) {
      effect32();
    }
    return effect32;
  }
  function stop(effect32) {
    if (effect32.active) {
      cleanup(effect32);
      if (effect32.options.onStop) {
        effect32.options.onStop();
      }
      effect32.active = false;
    }
  }
  var uid = 0;
  function createReactiveEffect(fn2, options) {
    const effect32 = function reactiveEffect() {
      if (!effect32.active) {
        return fn2();
      }
      if (!effectStack.includes(effect32)) {
        cleanup(effect32);
        try {
          enableTracking();
          effectStack.push(effect32);
          activeEffect = effect32;
          return fn2();
        } finally {
          effectStack.pop();
          resetTracking();
          activeEffect = effectStack[effectStack.length - 1];
        }
      }
    };
    effect32.id = uid++;
    effect32.allowRecurse = !!options.allowRecurse;
    effect32._isEffect = true;
    effect32.active = true;
    effect32.raw = fn2;
    effect32.deps = [];
    effect32.options = options;
    return effect32;
  }
  function cleanup(effect32) {
    const { deps } = effect32;
    if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect32);
      }
      deps.length = 0;
    }
  }
  var shouldTrack = true;
  var trackStack = [];
  function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
  }
  function enableTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = true;
  }
  function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === void 0 ? true : last;
  }
  function track(target, type, key) {
    if (!shouldTrack || activeEffect === void 0) {
      return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
      if (activeEffect.options.onTrack) {
        activeEffect.options.onTrack({
          effect: activeEffect,
          target,
          type,
          key
        });
      }
    }
  }
  function trigger(target, type, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    const effects = /* @__PURE__ */ new Set();
    const add2 = (effectsToAdd) => {
      if (effectsToAdd) {
        effectsToAdd.forEach((effect32) => {
          if (effect32 !== activeEffect || effect32.allowRecurse) {
            effects.add(effect32);
          }
        });
      }
    };
    if (type === "clear") {
      depsMap.forEach(add2);
    } else if (key === "length" && isArray(target)) {
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 >= newValue) {
          add2(dep);
        }
      });
    } else {
      if (key !== void 0) {
        add2(depsMap.get(key));
      }
      switch (type) {
        case "add":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isIntegerKey(key)) {
            add2(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            add2(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
    const run = (effect32) => {
      if (effect32.options.onTrigger) {
        effect32.options.onTrigger({
          effect: effect32,
          target,
          key,
          type,
          newValue,
          oldValue,
          oldTarget
        });
      }
      if (effect32.options.scheduler) {
        effect32.options.scheduler(effect32);
      } else {
        effect32();
      }
    };
    effects.forEach(run);
  }
  var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
  var builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map((key) => Symbol[key]).filter(isSymbol));
  var get2 = /* @__PURE__ */ createGetter();
  var shallowGet = /* @__PURE__ */ createGetter(false, true);
  var readonlyGet = /* @__PURE__ */ createGetter(true);
  var shallowReadonlyGet = /* @__PURE__ */ createGetter(true, true);
  var arrayInstrumentations = {};
  ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
    const method = Array.prototype[key];
    arrayInstrumentations[key] = function(...args) {
      const arr = toRaw(this);
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, "get", i + "");
      }
      const res = method.apply(arr, args);
      if (res === -1 || res === false) {
        return method.apply(arr, args.map(toRaw));
      } else {
        return res;
      }
    };
  });
  ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
    const method = Array.prototype[key];
    arrayInstrumentations[key] = function(...args) {
      pauseTracking();
      const res = method.apply(this, args);
      resetTracking();
      return res;
    };
  });
  function createGetter(isReadonly = false, shallow = false) {
    return function get3(target, key, receiver) {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw" && receiver === (isReadonly ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
        return target;
      }
      const targetIsArray = isArray(target);
      if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      const res = Reflect.get(target, key, receiver);
      if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
        return res;
      }
      if (!isReadonly) {
        track(target, "get", key);
      }
      if (shallow) {
        return res;
      }
      if (isRef(res)) {
        const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
        return shouldUnwrap ? res.value : res;
      }
      if (isObject(res)) {
        return isReadonly ? readonly(res) : reactive2(res);
      }
      return res;
    };
  }
  var set2 = /* @__PURE__ */ createSetter();
  var shallowSet = /* @__PURE__ */ createSetter(true);
  function createSetter(shallow = false) {
    return function set3(target, key, value, receiver) {
      let oldValue = target[key];
      if (!shallow) {
        value = toRaw(value);
        oldValue = toRaw(oldValue);
        if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
        }
      }
      const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
      const result = Reflect.set(target, key, value, receiver);
      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value, oldValue);
        }
      }
      return result;
    };
  }
  function deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  function ownKeys(target) {
    track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
  }
  var mutableHandlers = {
    get: get2,
    set: set2,
    deleteProperty,
    has,
    ownKeys
  };
  var readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
      if (true) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    },
    deleteProperty(target, key) {
      if (true) {
        console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
      }
      return true;
    }
  };
  var shallowReactiveHandlers = extend({}, mutableHandlers, {
    get: shallowGet,
    set: shallowSet
  });
  var shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
  });
  var toReactive = (value) => isObject(value) ? reactive2(value) : value;
  var toReadonly = (value) => isObject(value) ? readonly(value) : value;
  var toShallow = (value) => value;
  var getProto = (v) => Reflect.getPrototypeOf(v);
  function get$1(target, key, isReadonly = false, isShallow = false) {
    target = target["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "get", key);
    }
    !isReadonly && track(rawTarget, "get", rawKey);
    const { has: has2 } = getProto(rawTarget);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    if (has2.call(rawTarget, key)) {
      return wrap(target.get(key));
    } else if (has2.call(rawTarget, rawKey)) {
      return wrap(target.get(rawKey));
    } else if (target !== rawTarget) {
      target.get(key);
    }
  }
  function has$1(key, isReadonly = false) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
      !isReadonly && track(rawTarget, "has", key);
    }
    !isReadonly && track(rawTarget, "has", rawKey);
    return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
  }
  function size(target, isReadonly = false) {
    target = target["__v_raw"];
    !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
    return Reflect.get(target, "size", target);
  }
  function add(value) {
    value = toRaw(value);
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    if (!hadKey) {
      target.add(value);
      trigger(target, "add", value, value);
    }
    return this;
  }
  function set$1(key, value) {
    value = toRaw(value);
    const target = toRaw(this);
    const { has: has2, get: get3 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else if (true) {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3.call(target, key);
    target.set(key, value);
    if (!hadKey) {
      trigger(target, "add", key, value);
    } else if (hasChanged(value, oldValue)) {
      trigger(target, "set", key, value, oldValue);
    }
    return this;
  }
  function deleteEntry(key) {
    const target = toRaw(this);
    const { has: has2, get: get3 } = getProto(target);
    let hadKey = has2.call(target, key);
    if (!hadKey) {
      key = toRaw(key);
      hadKey = has2.call(target, key);
    } else if (true) {
      checkIdentityKeys(target, has2, key);
    }
    const oldValue = get3 ? get3.call(target, key) : void 0;
    const result = target.delete(key);
    if (hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }
  function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    const oldTarget = true ? isMap(target) ? new Map(target) : new Set(target) : void 0;
    const result = target.clear();
    if (hadItems) {
      trigger(target, "clear", void 0, void 0, oldTarget);
    }
    return result;
  }
  function createForEach(isReadonly, isShallow) {
    return function forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = toRaw(target);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    };
  }
  function createIterableMethod(method, isReadonly, isShallow) {
    return function(...args) {
      const target = this["__v_raw"];
      const rawTarget = toRaw(target);
      const targetIsMap = isMap(rawTarget);
      const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
      const isKeyOnly = method === "keys" && targetIsMap;
      const innerIterator = target[method](...args);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      !isReadonly && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
      return {
        next() {
          const { value, done } = innerIterator.next();
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        },
        [Symbol.iterator]() {
          return this;
        }
      };
    };
  }
  function createReadonlyMethod(type) {
    return function(...args) {
      if (true) {
        const key = args[0] ? `on key "${args[0]}" ` : ``;
        console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
      }
      return type === "delete" ? false : this;
    };
  }
  var mutableInstrumentations = {
    get(key) {
      return get$1(this, key);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false)
  };
  var shallowInstrumentations = {
    get(key) {
      return get$1(this, key, false, true);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true)
  };
  var readonlyInstrumentations = {
    get(key) {
      return get$1(this, key, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has$1.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, false)
  };
  var shallowReadonlyInstrumentations = {
    get(key) {
      return get$1(this, key, true, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has$1.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, true)
  };
  var iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
  iteratorMethods.forEach((method) => {
    mutableInstrumentations[method] = createIterableMethod(method, false, false);
    readonlyInstrumentations[method] = createIterableMethod(method, true, false);
    shallowInstrumentations[method] = createIterableMethod(method, false, true);
    shallowReadonlyInstrumentations[method] = createIterableMethod(method, true, true);
  });
  function createInstrumentationGetter(isReadonly, shallow) {
    const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
    return (target, key, receiver) => {
      if (key === "__v_isReactive") {
        return !isReadonly;
      } else if (key === "__v_isReadonly") {
        return isReadonly;
      } else if (key === "__v_raw") {
        return target;
      }
      return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
    };
  }
  var mutableCollectionHandlers = {
    get: createInstrumentationGetter(false, false)
  };
  var shallowCollectionHandlers = {
    get: createInstrumentationGetter(false, true)
  };
  var readonlyCollectionHandlers = {
    get: createInstrumentationGetter(true, false)
  };
  var shallowReadonlyCollectionHandlers = {
    get: createInstrumentationGetter(true, true)
  };
  function checkIdentityKeys(target, has2, key) {
    const rawKey = toRaw(key);
    if (rawKey !== key && has2.call(target, rawKey)) {
      const type = toRawType(target);
      console.warn(`Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`);
    }
  }
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  var shallowReactiveMap = /* @__PURE__ */ new WeakMap();
  var readonlyMap = /* @__PURE__ */ new WeakMap();
  var shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
  function targetTypeMap(rawType) {
    switch (rawType) {
      case "Object":
      case "Array":
        return 1;
      case "Map":
      case "Set":
      case "WeakMap":
      case "WeakSet":
        return 2;
      default:
        return 0;
    }
  }
  function getTargetType(value) {
    return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
  }
  function reactive2(target) {
    if (target && target["__v_isReadonly"]) {
      return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
  }
  function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
  }
  function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
    if (!isObject(target)) {
      if (true) {
        console.warn(`value cannot be made reactive: ${String(target)}`);
      }
      return target;
    }
    if (target["__v_raw"] && !(isReadonly && target["__v_isReactive"])) {
      return target;
    }
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const targetType = getTargetType(target);
    if (targetType === 0) {
      return target;
    }
    const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function toRaw(observed) {
    return observed && toRaw(observed["__v_raw"]) || observed;
  }
  function isRef(r) {
    return Boolean(r && r.__v_isRef === true);
  }
  magic("nextTick", () => nextTick);
  magic("dispatch", (el) => dispatch.bind(dispatch, el));
  magic("watch", (el, { evaluateLater: evaluateLater2, effect: effect32 }) => (key, callback) => {
    let evaluate2 = evaluateLater2(key);
    let firstTime = true;
    let oldValue;
    let effectReference = effect32(() => evaluate2((value) => {
      JSON.stringify(value);
      if (!firstTime) {
        queueMicrotask(() => {
          callback(value, oldValue);
          oldValue = value;
        });
      } else {
        oldValue = value;
      }
      firstTime = false;
    }));
    el._x_effects.delete(effectReference);
  });
  magic("store", getStores);
  magic("data", (el) => scope(el));
  magic("root", (el) => closestRoot(el));
  magic("refs", (el) => {
    if (el._x_refs_proxy)
      return el._x_refs_proxy;
    el._x_refs_proxy = mergeProxies(getArrayOfRefObject(el));
    return el._x_refs_proxy;
  });
  function getArrayOfRefObject(el) {
    let refObjects = [];
    let currentEl = el;
    while (currentEl) {
      if (currentEl._x_refs)
        refObjects.push(currentEl._x_refs);
      currentEl = currentEl.parentNode;
    }
    return refObjects;
  }
  var globalIdMemo = {};
  function findAndIncrementId(name) {
    if (!globalIdMemo[name])
      globalIdMemo[name] = 0;
    return ++globalIdMemo[name];
  }
  function closestIdRoot(el, name) {
    return findClosest(el, (element) => {
      if (element._x_ids && element._x_ids[name])
        return true;
    });
  }
  function setIdRoot(el, name) {
    if (!el._x_ids)
      el._x_ids = {};
    if (!el._x_ids[name])
      el._x_ids[name] = findAndIncrementId(name);
  }
  magic("id", (el) => (name, key = null) => {
    let root = closestIdRoot(el, name);
    let id = root ? root._x_ids[name] : findAndIncrementId(name);
    return key ? `${name}-${id}-${key}` : `${name}-${id}`;
  });
  magic("el", (el) => el);
  warnMissingPluginMagic("Focus", "focus", "focus");
  warnMissingPluginMagic("Persist", "persist", "persist");
  function warnMissingPluginMagic(name, magicName, slug) {
    magic(magicName, (el) => warn(`You can't use [$${directiveName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
  }
  function entangle({ get: outerGet, set: outerSet }, { get: innerGet, set: innerSet }) {
    let firstRun = true;
    let outerHash, innerHash, outerHashLatest, innerHashLatest;
    let reference2 = effect(() => {
      let outer, inner;
      if (firstRun) {
        outer = outerGet();
        innerSet(outer);
        inner = innerGet();
        firstRun = false;
      } else {
        outer = outerGet();
        inner = innerGet();
        outerHashLatest = JSON.stringify(outer);
        innerHashLatest = JSON.stringify(inner);
        if (outerHashLatest !== outerHash) {
          inner = innerGet();
          innerSet(outer);
          inner = outer;
        } else {
          outerSet(inner);
          outer = inner;
        }
      }
      outerHash = JSON.stringify(outer);
      innerHash = JSON.stringify(inner);
    });
    return () => {
      release(reference2);
    };
  }
  directive("modelable", (el, { expression }, { effect: effect32, evaluateLater: evaluateLater2, cleanup: cleanup2 }) => {
    let func = evaluateLater2(expression);
    let innerGet = () => {
      let result;
      func((i) => result = i);
      return result;
    };
    let evaluateInnerSet = evaluateLater2(`${expression} = __placeholder`);
    let innerSet = (val) => evaluateInnerSet(() => {
    }, { scope: { __placeholder: val } });
    let initialValue = innerGet();
    innerSet(initialValue);
    queueMicrotask(() => {
      if (!el._x_model)
        return;
      el._x_removeModelListeners["default"]();
      let outerGet = el._x_model.get;
      let outerSet = el._x_model.set;
      let releaseEntanglement = entangle({
        get() {
          return outerGet();
        },
        set(value) {
          outerSet(value);
        }
      }, {
        get() {
          return innerGet();
        },
        set(value) {
          innerSet(value);
        }
      });
      cleanup2(releaseEntanglement);
    });
  });
  var teleportContainerDuringClone = document.createElement("div");
  directive("teleport", (el, { modifiers, expression }, { cleanup: cleanup2 }) => {
    if (el.tagName.toLowerCase() !== "template")
      warn("x-teleport can only be used on a <template> tag", el);
    let target = skipDuringClone(() => {
      return document.querySelector(expression);
    }, () => {
      return teleportContainerDuringClone;
    })();
    if (!target)
      warn(`Cannot find x-teleport element for selector: "${expression}"`);
    let clone2 = el.content.cloneNode(true).firstElementChild;
    el._x_teleport = clone2;
    clone2._x_teleportBack = el;
    if (el._x_forwardEvents) {
      el._x_forwardEvents.forEach((eventName) => {
        clone2.addEventListener(eventName, (e) => {
          e.stopPropagation();
          el.dispatchEvent(new e.constructor(e.type, e));
        });
      });
    }
    addScopeToNode(clone2, {}, el);
    mutateDom(() => {
      if (modifiers.includes("prepend")) {
        target.parentNode.insertBefore(clone2, target);
      } else if (modifiers.includes("append")) {
        target.parentNode.insertBefore(clone2, target.nextSibling);
      } else {
        target.appendChild(clone2);
      }
      initTree(clone2);
      clone2._x_ignore = true;
    });
    cleanup2(() => clone2.remove());
  });
  var handler = () => {
  };
  handler.inline = (el, { modifiers }, { cleanup: cleanup2 }) => {
    modifiers.includes("self") ? el._x_ignoreSelf = true : el._x_ignore = true;
    cleanup2(() => {
      modifiers.includes("self") ? delete el._x_ignoreSelf : delete el._x_ignore;
    });
  };
  directive("ignore", handler);
  directive("effect", (el, { expression }, { effect: effect32 }) => effect32(evaluateLater(el, expression)));
  function on(el, event, modifiers, callback) {
    let listenerTarget = el;
    let handler3 = (e) => callback(e);
    let options = {};
    let wrapHandler = (callback2, wrapper) => (e) => wrapper(callback2, e);
    if (modifiers.includes("dot"))
      event = dotSyntax(event);
    if (modifiers.includes("camel"))
      event = camelCase2(event);
    if (modifiers.includes("passive"))
      options.passive = true;
    if (modifiers.includes("capture"))
      options.capture = true;
    if (modifiers.includes("window"))
      listenerTarget = window;
    if (modifiers.includes("document"))
      listenerTarget = document;
    if (modifiers.includes("prevent"))
      handler3 = wrapHandler(handler3, (next, e) => {
        e.preventDefault();
        next(e);
      });
    if (modifiers.includes("stop"))
      handler3 = wrapHandler(handler3, (next, e) => {
        e.stopPropagation();
        next(e);
      });
    if (modifiers.includes("self"))
      handler3 = wrapHandler(handler3, (next, e) => {
        e.target === el && next(e);
      });
    if (modifiers.includes("away") || modifiers.includes("outside")) {
      listenerTarget = document;
      handler3 = wrapHandler(handler3, (next, e) => {
        if (el.contains(e.target))
          return;
        if (e.target.isConnected === false)
          return;
        if (el.offsetWidth < 1 && el.offsetHeight < 1)
          return;
        if (el._x_isShown === false)
          return;
        next(e);
      });
    }
    if (modifiers.includes("once")) {
      handler3 = wrapHandler(handler3, (next, e) => {
        next(e);
        listenerTarget.removeEventListener(event, handler3, options);
      });
    }
    handler3 = wrapHandler(handler3, (next, e) => {
      if (isKeyEvent(event)) {
        if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
          return;
        }
      }
      next(e);
    });
    if (modifiers.includes("debounce")) {
      let nextModifier = modifiers[modifiers.indexOf("debounce") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler3 = debounce(handler3, wait);
    }
    if (modifiers.includes("throttle")) {
      let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler3 = throttle(handler3, wait);
    }
    listenerTarget.addEventListener(event, handler3, options);
    return () => {
      listenerTarget.removeEventListener(event, handler3, options);
    };
  }
  function dotSyntax(subject) {
    return subject.replace(/-/g, ".");
  }
  function camelCase2(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function isNumeric(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function kebabCase2(subject) {
    if ([" ", "_"].includes(subject))
      return subject;
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[_\s]/, "-").toLowerCase();
  }
  function isKeyEvent(event) {
    return ["keydown", "keyup"].includes(event);
  }
  function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
    let keyModifiers = modifiers.filter((i) => {
      return !["window", "document", "prevent", "stop", "once"].includes(i);
    });
    if (keyModifiers.includes("debounce")) {
      let debounceIndex = keyModifiers.indexOf("debounce");
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
    }
    if (keyModifiers.includes("throttle")) {
      let debounceIndex = keyModifiers.indexOf("throttle");
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
    }
    if (keyModifiers.length === 0)
      return false;
    if (keyModifiers.length === 1 && keyToModifiers(e.key).includes(keyModifiers[0]))
      return false;
    const systemKeyModifiers = ["ctrl", "shift", "alt", "meta", "cmd", "super"];
    const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) => keyModifiers.includes(modifier));
    keyModifiers = keyModifiers.filter((i) => !selectedSystemKeyModifiers.includes(i));
    if (selectedSystemKeyModifiers.length > 0) {
      const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter((modifier) => {
        if (modifier === "cmd" || modifier === "super")
          modifier = "meta";
        return e[`${modifier}Key`];
      });
      if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
        if (keyToModifiers(e.key).includes(keyModifiers[0]))
          return false;
      }
    }
    return true;
  }
  function keyToModifiers(key) {
    if (!key)
      return [];
    key = kebabCase2(key);
    let modifierToKeyMap = {
      ctrl: "control",
      slash: "/",
      space: " ",
      spacebar: " ",
      cmd: "meta",
      esc: "escape",
      up: "arrow-up",
      down: "arrow-down",
      left: "arrow-left",
      right: "arrow-right",
      period: ".",
      equal: "=",
      minus: "-",
      underscore: "_"
    };
    modifierToKeyMap[key] = key;
    return Object.keys(modifierToKeyMap).map((modifier) => {
      if (modifierToKeyMap[modifier] === key)
        return modifier;
    }).filter((modifier) => modifier);
  }
  directive("model", (el, { modifiers, expression }, { effect: effect32, cleanup: cleanup2 }) => {
    let scopeTarget = el;
    if (modifiers.includes("parent")) {
      scopeTarget = el.parentNode;
    }
    let evaluateGet = evaluateLater(scopeTarget, expression);
    let evaluateSet;
    if (typeof expression === "string") {
      evaluateSet = evaluateLater(scopeTarget, `${expression} = __placeholder`);
    } else if (typeof expression === "function" && typeof expression() === "string") {
      evaluateSet = evaluateLater(scopeTarget, `${expression()} = __placeholder`);
    } else {
      evaluateSet = () => {
      };
    }
    let getValue = () => {
      let result;
      evaluateGet((value) => result = value);
      return isGetterSetter(result) ? result.get() : result;
    };
    let setValue = (value) => {
      let result;
      evaluateGet((value2) => result = value2);
      if (isGetterSetter(result)) {
        result.set(value);
      } else {
        evaluateSet(() => {
        }, {
          scope: { __placeholder: value }
        });
      }
    };
    if (typeof expression === "string" && el.type === "radio") {
      mutateDom(() => {
        if (!el.hasAttribute("name"))
          el.setAttribute("name", expression);
      });
    }
    var event = el.tagName.toLowerCase() === "select" || ["checkbox", "radio"].includes(el.type) || modifiers.includes("lazy") ? "change" : "input";
    let removeListener = on(el, event, modifiers, (e) => {
      setValue(getInputValue(el, modifiers, e, getValue()));
    });
    if (!el._x_removeModelListeners)
      el._x_removeModelListeners = {};
    el._x_removeModelListeners["default"] = removeListener;
    cleanup2(() => el._x_removeModelListeners["default"]());
    if (el.form) {
      let removeResetListener = on(el.form, "reset", [], (e) => {
        nextTick(() => el._x_model && el._x_model.set(el.value));
      });
      cleanup2(() => removeResetListener());
    }
    el._x_model = {
      get() {
        return getValue();
      },
      set(value) {
        setValue(value);
      }
    };
    el._x_forceModelUpdate = (value) => {
      value = value === void 0 ? getValue() : value;
      if (value === void 0 && typeof expression === "string" && expression.match(/\./))
        value = "";
      window.fromModel = true;
      mutateDom(() => bind(el, "value", value));
      delete window.fromModel;
    };
    effect32(() => {
      let value = getValue();
      if (modifiers.includes("unintrusive") && document.activeElement.isSameNode(el))
        return;
      el._x_forceModelUpdate(value);
    });
  });
  function getInputValue(el, modifiers, event, currentValue) {
    return mutateDom(() => {
      if (event instanceof CustomEvent && event.detail !== void 0) {
        return typeof event.detail != "undefined" ? event.detail : event.target.value;
      } else if (el.type === "checkbox") {
        if (Array.isArray(currentValue)) {
          let newValue = modifiers.includes("number") ? safeParseNumber(event.target.value) : event.target.value;
          return event.target.checked ? currentValue.concat([newValue]) : currentValue.filter((el2) => !checkedAttrLooseCompare2(el2, newValue));
        } else {
          return event.target.checked;
        }
      } else if (el.tagName.toLowerCase() === "select" && el.multiple) {
        return modifiers.includes("number") ? Array.from(event.target.selectedOptions).map((option) => {
          let rawValue = option.value || option.text;
          return safeParseNumber(rawValue);
        }) : Array.from(event.target.selectedOptions).map((option) => {
          return option.value || option.text;
        });
      } else {
        let rawValue = event.target.value;
        return modifiers.includes("number") ? safeParseNumber(rawValue) : modifiers.includes("trim") ? rawValue.trim() : rawValue;
      }
    });
  }
  function safeParseNumber(rawValue) {
    let number = rawValue ? parseFloat(rawValue) : null;
    return isNumeric2(number) ? number : rawValue;
  }
  function checkedAttrLooseCompare2(valueA, valueB) {
    return valueA == valueB;
  }
  function isNumeric2(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function isGetterSetter(value) {
    return value !== null && typeof value === "object" && typeof value.get === "function" && typeof value.set === "function";
  }
  directive("cloak", (el) => queueMicrotask(() => mutateDom(() => el.removeAttribute(prefix("cloak")))));
  addInitSelector(() => `[${prefix("init")}]`);
  directive("init", skipDuringClone((el, { expression }, { evaluate: evaluate2 }) => {
    if (typeof expression === "string") {
      return !!expression.trim() && evaluate2(expression, {}, false);
    }
    return evaluate2(expression, {}, false);
  }));
  directive("text", (el, { expression }, { effect: effect32, evaluateLater: evaluateLater2 }) => {
    let evaluate2 = evaluateLater2(expression);
    effect32(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.textContent = value;
        });
      });
    });
  });
  directive("html", (el, { expression }, { effect: effect32, evaluateLater: evaluateLater2 }) => {
    let evaluate2 = evaluateLater2(expression);
    effect32(() => {
      evaluate2((value) => {
        mutateDom(() => {
          el.innerHTML = value;
          el._x_ignoreSelf = true;
          initTree(el);
          delete el._x_ignoreSelf;
        });
      });
    });
  });
  mapAttributes(startingWith(":", into(prefix("bind:"))));
  directive("bind", (el, { value, modifiers, expression, original }, { effect: effect32 }) => {
    if (!value) {
      let bindingProviders = {};
      injectBindingProviders(bindingProviders);
      let getBindings = evaluateLater(el, expression);
      getBindings((bindings) => {
        applyBindingsObject(el, bindings, original);
      }, { scope: bindingProviders });
      return;
    }
    if (value === "key")
      return storeKeyForXFor(el, expression);
    let evaluate2 = evaluateLater(el, expression);
    effect32(() => evaluate2((result) => {
      if (result === void 0 && typeof expression === "string" && expression.match(/\./)) {
        result = "";
      }
      mutateDom(() => bind(el, value, result, modifiers));
    }));
  });
  function storeKeyForXFor(el, expression) {
    el._x_keyExpression = expression;
  }
  addRootSelector(() => `[${prefix("data")}]`);
  directive("data", skipDuringClone((el, { expression }, { cleanup: cleanup2 }) => {
    expression = expression === "" ? "{}" : expression;
    let magicContext = {};
    injectMagics(magicContext, el);
    let dataProviderContext = {};
    injectDataProviders(dataProviderContext, magicContext);
    let data2 = evaluate(el, expression, { scope: dataProviderContext });
    if (data2 === void 0)
      data2 = {};
    injectMagics(data2, el);
    let reactiveData = reactive(data2);
    initInterceptors(reactiveData);
    let undo = addScopeToNode(el, reactiveData);
    reactiveData["init"] && evaluate(el, reactiveData["init"]);
    cleanup2(() => {
      reactiveData["destroy"] && evaluate(el, reactiveData["destroy"]);
      undo();
    });
  }));
  directive("show", (el, { modifiers, expression }, { effect: effect32 }) => {
    let evaluate2 = evaluateLater(el, expression);
    if (!el._x_doHide)
      el._x_doHide = () => {
        mutateDom(() => {
          el.style.setProperty("display", "none", modifiers.includes("important") ? "important" : void 0);
        });
      };
    if (!el._x_doShow)
      el._x_doShow = () => {
        mutateDom(() => {
          if (el.style.length === 1 && el.style.display === "none") {
            el.removeAttribute("style");
          } else {
            el.style.removeProperty("display");
          }
        });
      };
    let hide2 = () => {
      el._x_doHide();
      el._x_isShown = false;
    };
    let show = () => {
      el._x_doShow();
      el._x_isShown = true;
    };
    let clickAwayCompatibleShow = () => setTimeout(show);
    let toggle = once((value) => value ? show() : hide2(), (value) => {
      if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
        el._x_toggleAndCascadeWithTransitions(el, value, show, hide2);
      } else {
        value ? clickAwayCompatibleShow() : hide2();
      }
    });
    let oldValue;
    let firstTime = true;
    effect32(() => evaluate2((value) => {
      if (!firstTime && value === oldValue)
        return;
      if (modifiers.includes("immediate"))
        value ? clickAwayCompatibleShow() : hide2();
      toggle(value);
      oldValue = value;
      firstTime = false;
    }));
  });
  directive("for", (el, { expression }, { effect: effect32, cleanup: cleanup2 }) => {
    let iteratorNames = parseForExpression(expression);
    let evaluateItems = evaluateLater(el, iteratorNames.items);
    let evaluateKey = evaluateLater(el, el._x_keyExpression || "index");
    el._x_prevKeys = [];
    el._x_lookup = {};
    effect32(() => loop(el, iteratorNames, evaluateItems, evaluateKey));
    cleanup2(() => {
      Object.values(el._x_lookup).forEach((el2) => el2.remove());
      delete el._x_prevKeys;
      delete el._x_lookup;
    });
  });
  function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let isObject2 = (i) => typeof i === "object" && !Array.isArray(i);
    let templateEl = el;
    evaluateItems((items) => {
      if (isNumeric3(items) && items >= 0) {
        items = Array.from(Array(items).keys(), (i) => i + 1);
      }
      if (items === void 0)
        items = [];
      let lookup = el._x_lookup;
      let prevKeys = el._x_prevKeys;
      let scopes = [];
      let keys = [];
      if (isObject2(items)) {
        items = Object.entries(items).map(([key, value]) => {
          let scope2 = getIterationScopeVariables(iteratorNames, value, key, items);
          evaluateKey((value2) => keys.push(value2), { scope: { index: key, ...scope2 } });
          scopes.push(scope2);
        });
      } else {
        for (let i = 0; i < items.length; i++) {
          let scope2 = getIterationScopeVariables(iteratorNames, items[i], i, items);
          evaluateKey((value) => keys.push(value), { scope: { index: i, ...scope2 } });
          scopes.push(scope2);
        }
      }
      let adds = [];
      let moves = [];
      let removes = [];
      let sames = [];
      for (let i = 0; i < prevKeys.length; i++) {
        let key = prevKeys[i];
        if (keys.indexOf(key) === -1)
          removes.push(key);
      }
      prevKeys = prevKeys.filter((key) => !removes.includes(key));
      let lastKey = "template";
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let prevIndex = prevKeys.indexOf(key);
        if (prevIndex === -1) {
          prevKeys.splice(i, 0, key);
          adds.push([lastKey, i]);
        } else if (prevIndex !== i) {
          let keyInSpot = prevKeys.splice(i, 1)[0];
          let keyForSpot = prevKeys.splice(prevIndex - 1, 1)[0];
          prevKeys.splice(i, 0, keyForSpot);
          prevKeys.splice(prevIndex, 0, keyInSpot);
          moves.push([keyInSpot, keyForSpot]);
        } else {
          sames.push(key);
        }
        lastKey = key;
      }
      for (let i = 0; i < removes.length; i++) {
        let key = removes[i];
        if (!!lookup[key]._x_effects) {
          lookup[key]._x_effects.forEach(dequeueJob);
        }
        lookup[key].remove();
        lookup[key] = null;
        delete lookup[key];
      }
      for (let i = 0; i < moves.length; i++) {
        let [keyInSpot, keyForSpot] = moves[i];
        let elInSpot = lookup[keyInSpot];
        let elForSpot = lookup[keyForSpot];
        let marker = document.createElement("div");
        mutateDom(() => {
          elForSpot.after(marker);
          elInSpot.after(elForSpot);
          elForSpot._x_currentIfEl && elForSpot.after(elForSpot._x_currentIfEl);
          marker.before(elInSpot);
          elInSpot._x_currentIfEl && elInSpot.after(elInSpot._x_currentIfEl);
          marker.remove();
        });
        refreshScope(elForSpot, scopes[keys.indexOf(keyForSpot)]);
      }
      for (let i = 0; i < adds.length; i++) {
        let [lastKey2, index] = adds[i];
        let lastEl = lastKey2 === "template" ? templateEl : lookup[lastKey2];
        if (lastEl._x_currentIfEl)
          lastEl = lastEl._x_currentIfEl;
        let scope2 = scopes[index];
        let key = keys[index];
        let clone2 = document.importNode(templateEl.content, true).firstElementChild;
        addScopeToNode(clone2, reactive(scope2), templateEl);
        mutateDom(() => {
          lastEl.after(clone2);
          initTree(clone2);
        });
        if (typeof key === "object") {
          warn("x-for key cannot be an object, it must be a string or an integer", templateEl);
        }
        lookup[key] = clone2;
      }
      for (let i = 0; i < sames.length; i++) {
        refreshScope(lookup[sames[i]], scopes[keys.indexOf(sames[i])]);
      }
      templateEl._x_prevKeys = keys;
    });
  }
  function parseForExpression(expression) {
    let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    let stripParensRE = /^\s*\(|\)\s*$/g;
    let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    let inMatch = expression.match(forAliasRE);
    if (!inMatch)
      return;
    let res = {};
    res.items = inMatch[2].trim();
    let item = inMatch[1].replace(stripParensRE, "").trim();
    let iteratorMatch = item.match(forIteratorRE);
    if (iteratorMatch) {
      res.item = item.replace(forIteratorRE, "").trim();
      res.index = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        res.collection = iteratorMatch[2].trim();
      }
    } else {
      res.item = item;
    }
    return res;
  }
  function getIterationScopeVariables(iteratorNames, item, index, items) {
    let scopeVariables = {};
    if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(item)) {
      let names = iteratorNames.item.replace("[", "").replace("]", "").split(",").map((i) => i.trim());
      names.forEach((name, i) => {
        scopeVariables[name] = item[i];
      });
    } else if (/^\{.*\}$/.test(iteratorNames.item) && !Array.isArray(item) && typeof item === "object") {
      let names = iteratorNames.item.replace("{", "").replace("}", "").split(",").map((i) => i.trim());
      names.forEach((name) => {
        scopeVariables[name] = item[name];
      });
    } else {
      scopeVariables[iteratorNames.item] = item;
    }
    if (iteratorNames.index)
      scopeVariables[iteratorNames.index] = index;
    if (iteratorNames.collection)
      scopeVariables[iteratorNames.collection] = items;
    return scopeVariables;
  }
  function isNumeric3(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function handler2() {
  }
  handler2.inline = (el, { expression }, { cleanup: cleanup2 }) => {
    let root = closestRoot(el);
    if (!root._x_refs)
      root._x_refs = {};
    root._x_refs[expression] = el;
    cleanup2(() => delete root._x_refs[expression]);
  };
  directive("ref", handler2);
  directive("if", (el, { expression }, { effect: effect32, cleanup: cleanup2 }) => {
    let evaluate2 = evaluateLater(el, expression);
    let show = () => {
      if (el._x_currentIfEl)
        return el._x_currentIfEl;
      let clone2 = el.content.cloneNode(true).firstElementChild;
      addScopeToNode(clone2, {}, el);
      mutateDom(() => {
        el.after(clone2);
        initTree(clone2);
      });
      el._x_currentIfEl = clone2;
      el._x_undoIf = () => {
        walk(clone2, (node) => {
          if (!!node._x_effects) {
            node._x_effects.forEach(dequeueJob);
          }
        });
        clone2.remove();
        delete el._x_currentIfEl;
      };
      return clone2;
    };
    let hide2 = () => {
      if (!el._x_undoIf)
        return;
      el._x_undoIf();
      delete el._x_undoIf;
    };
    effect32(() => evaluate2((value) => {
      value ? show() : hide2();
    }));
    cleanup2(() => el._x_undoIf && el._x_undoIf());
  });
  directive("id", (el, { expression }, { evaluate: evaluate2 }) => {
    let names = evaluate2(expression);
    names.forEach((name) => setIdRoot(el, name));
  });
  mapAttributes(startingWith("@", into(prefix("on:"))));
  directive("on", skipDuringClone((el, { value, modifiers, expression }, { cleanup: cleanup2 }) => {
    let evaluate2 = expression ? evaluateLater(el, expression) : () => {
    };
    if (el.tagName.toLowerCase() === "template") {
      if (!el._x_forwardEvents)
        el._x_forwardEvents = [];
      if (!el._x_forwardEvents.includes(value))
        el._x_forwardEvents.push(value);
    }
    let removeListener = on(el, value, modifiers, (e) => {
      evaluate2(() => {
      }, { scope: { $event: e }, params: [e] });
    });
    cleanup2(() => removeListener());
  }));
  warnMissingPluginDirective("Collapse", "collapse", "collapse");
  warnMissingPluginDirective("Intersect", "intersect", "intersect");
  warnMissingPluginDirective("Focus", "trap", "focus");
  warnMissingPluginDirective("Mask", "mask", "mask");
  function warnMissingPluginDirective(name, directiveName2, slug) {
    directive(directiveName2, (el) => warn(`You can't use [x-${directiveName2}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
  }
  alpine_default.setEvaluator(normalEvaluator);
  alpine_default.setReactivityEngine({ reactive: reactive2, effect: effect2, release: stop, raw: toRaw });
  var src_default = alpine_default;
  var module_default = src_default;

  // src/_scripts/alpine.js
  window.Alpine = module_default;
  window.addEventListener("DOMContentLoaded", () => {
    module_default.start();
  });
  window.addEventListener("alpine:initializing", () => {
    module_default.store("nav", {
      isOpen: false,
      close() {
        return this.isOpen = false;
      },
      open() {
        return this.isOpen = true;
      },
      toggle() {
        return this.isOpen = !this.isOpen;
      }
    });
  });

  // node_modules/flowbite/lib/esm/dom/events.js
  var Events = (
    /** @class */
    function() {
      function Events2(eventType, eventFunctions) {
        if (eventFunctions === void 0) {
          eventFunctions = [];
        }
        this._eventType = eventType;
        this._eventFunctions = eventFunctions;
      }
      Events2.prototype.init = function() {
        var _this = this;
        this._eventFunctions.forEach(function(eventFunction) {
          if (typeof window !== "undefined") {
            window.addEventListener(_this._eventType, eventFunction);
          }
        });
      };
      return Events2;
    }()
  );
  var events_default = Events;

  // node_modules/flowbite/lib/esm/dom/instances.js
  var Instances = (
    /** @class */
    function() {
      function Instances2() {
        this._instances = {
          Accordion: {},
          Carousel: {},
          Collapse: {},
          Dial: {},
          Dismiss: {},
          Drawer: {},
          Dropdown: {},
          Modal: {},
          Popover: {},
          Tabs: {},
          Tooltip: {},
          InputCounter: {},
          CopyClipboard: {},
          Datepicker: {}
        };
      }
      Instances2.prototype.addInstance = function(component, instance, id, override) {
        if (override === void 0) {
          override = false;
        }
        if (!this._instances[component]) {
          console.warn("Flowbite: Component ".concat(component, " does not exist."));
          return false;
        }
        if (this._instances[component][id] && !override) {
          console.warn("Flowbite: Instance with ID ".concat(id, " already exists."));
          return;
        }
        if (override && this._instances[component][id]) {
          this._instances[component][id].destroyAndRemoveInstance();
        }
        this._instances[component][id ? id : this._generateRandomId()] = instance;
      };
      Instances2.prototype.getAllInstances = function() {
        return this._instances;
      };
      Instances2.prototype.getInstances = function(component) {
        if (!this._instances[component]) {
          console.warn("Flowbite: Component ".concat(component, " does not exist."));
          return false;
        }
        return this._instances[component];
      };
      Instances2.prototype.getInstance = function(component, id) {
        if (!this._componentAndInstanceCheck(component, id)) {
          return;
        }
        if (!this._instances[component][id]) {
          console.warn("Flowbite: Instance with ID ".concat(id, " does not exist."));
          return;
        }
        return this._instances[component][id];
      };
      Instances2.prototype.destroyAndRemoveInstance = function(component, id) {
        if (!this._componentAndInstanceCheck(component, id)) {
          return;
        }
        this.destroyInstanceObject(component, id);
        this.removeInstance(component, id);
      };
      Instances2.prototype.removeInstance = function(component, id) {
        if (!this._componentAndInstanceCheck(component, id)) {
          return;
        }
        delete this._instances[component][id];
      };
      Instances2.prototype.destroyInstanceObject = function(component, id) {
        if (!this._componentAndInstanceCheck(component, id)) {
          return;
        }
        this._instances[component][id].destroy();
      };
      Instances2.prototype.instanceExists = function(component, id) {
        if (!this._instances[component]) {
          return false;
        }
        if (!this._instances[component][id]) {
          return false;
        }
        return true;
      };
      Instances2.prototype._generateRandomId = function() {
        return Math.random().toString(36).substr(2, 9);
      };
      Instances2.prototype._componentAndInstanceCheck = function(component, id) {
        if (!this._instances[component]) {
          console.warn("Flowbite: Component ".concat(component, " does not exist."));
          return false;
        }
        if (!this._instances[component][id]) {
          console.warn("Flowbite: Instance with ID ".concat(id, " does not exist."));
          return false;
        }
        return true;
      };
      return Instances2;
    }()
  );
  var instances = new Instances();
  var instances_default = instances;
  if (typeof window !== "undefined") {
    window.FlowbiteInstances = instances;
  }

  // node_modules/flowbite/lib/esm/components/accordion/index.js
  var __assign = function() {
    __assign = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };
  var Default = {
    alwaysOpen: false,
    activeClasses: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white",
    inactiveClasses: "text-gray-500 dark:text-gray-400",
    onOpen: function() {
    },
    onClose: function() {
    },
    onToggle: function() {
    }
  };
  var DefaultInstanceOptions = {
    id: null,
    override: true
  };
  var Accordion = (
    /** @class */
    function() {
      function Accordion2(accordionEl, items, options, instanceOptions) {
        if (accordionEl === void 0) {
          accordionEl = null;
        }
        if (items === void 0) {
          items = [];
        }
        if (options === void 0) {
          options = Default;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : accordionEl.id;
        this._accordionEl = accordionEl;
        this._items = items;
        this._options = __assign(__assign({}, Default), options);
        this._initialized = false;
        this.init();
        instances_default.addInstance("Accordion", this, this._instanceId, instanceOptions.override);
      }
      Accordion2.prototype.init = function() {
        var _this = this;
        if (this._items.length && !this._initialized) {
          this._items.forEach(function(item) {
            if (item.active) {
              _this.open(item.id);
            }
            var clickHandler = function() {
              _this.toggle(item.id);
            };
            item.triggerEl.addEventListener("click", clickHandler);
            item.clickHandler = clickHandler;
          });
          this._initialized = true;
        }
      };
      Accordion2.prototype.destroy = function() {
        if (this._items.length && this._initialized) {
          this._items.forEach(function(item) {
            item.triggerEl.removeEventListener("click", item.clickHandler);
            delete item.clickHandler;
          });
          this._initialized = false;
        }
      };
      Accordion2.prototype.removeInstance = function() {
        instances_default.removeInstance("Accordion", this._instanceId);
      };
      Accordion2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Accordion2.prototype.getItem = function(id) {
        return this._items.filter(function(item) {
          return item.id === id;
        })[0];
      };
      Accordion2.prototype.open = function(id) {
        var _a, _b;
        var _this = this;
        var item = this.getItem(id);
        if (!this._options.alwaysOpen) {
          this._items.map(function(i) {
            var _a2, _b2;
            if (i !== item) {
              (_a2 = i.triggerEl.classList).remove.apply(_a2, _this._options.activeClasses.split(" "));
              (_b2 = i.triggerEl.classList).add.apply(_b2, _this._options.inactiveClasses.split(" "));
              i.targetEl.classList.add("hidden");
              i.triggerEl.setAttribute("aria-expanded", "false");
              i.active = false;
              if (i.iconEl) {
                i.iconEl.classList.add("rotate-180");
              }
            }
          });
        }
        (_a = item.triggerEl.classList).add.apply(_a, this._options.activeClasses.split(" "));
        (_b = item.triggerEl.classList).remove.apply(_b, this._options.inactiveClasses.split(" "));
        item.triggerEl.setAttribute("aria-expanded", "true");
        item.targetEl.classList.remove("hidden");
        item.active = true;
        if (item.iconEl) {
          item.iconEl.classList.remove("rotate-180");
        }
        this._options.onOpen(this, item);
      };
      Accordion2.prototype.toggle = function(id) {
        var item = this.getItem(id);
        if (item.active) {
          this.close(id);
        } else {
          this.open(id);
        }
        this._options.onToggle(this, item);
      };
      Accordion2.prototype.close = function(id) {
        var _a, _b;
        var item = this.getItem(id);
        (_a = item.triggerEl.classList).remove.apply(_a, this._options.activeClasses.split(" "));
        (_b = item.triggerEl.classList).add.apply(_b, this._options.inactiveClasses.split(" "));
        item.targetEl.classList.add("hidden");
        item.triggerEl.setAttribute("aria-expanded", "false");
        item.active = false;
        if (item.iconEl) {
          item.iconEl.classList.add("rotate-180");
        }
        this._options.onClose(this, item);
      };
      Accordion2.prototype.updateOnOpen = function(callback) {
        this._options.onOpen = callback;
      };
      Accordion2.prototype.updateOnClose = function(callback) {
        this._options.onClose = callback;
      };
      Accordion2.prototype.updateOnToggle = function(callback) {
        this._options.onToggle = callback;
      };
      return Accordion2;
    }()
  );
  function initAccordions() {
    document.querySelectorAll("[data-accordion]").forEach(function($accordionEl) {
      var alwaysOpen = $accordionEl.getAttribute("data-accordion");
      var activeClasses = $accordionEl.getAttribute("data-active-classes");
      var inactiveClasses = $accordionEl.getAttribute("data-inactive-classes");
      var items = [];
      $accordionEl.querySelectorAll("[data-accordion-target]").forEach(function($triggerEl) {
        if ($triggerEl.closest("[data-accordion]") === $accordionEl) {
          var item = {
            id: $triggerEl.getAttribute("data-accordion-target"),
            triggerEl: $triggerEl,
            targetEl: document.querySelector($triggerEl.getAttribute("data-accordion-target")),
            iconEl: $triggerEl.querySelector("[data-accordion-icon]"),
            active: $triggerEl.getAttribute("aria-expanded") === "true" ? true : false
          };
          items.push(item);
        }
      });
      new Accordion($accordionEl, items, {
        alwaysOpen: alwaysOpen === "open" ? true : false,
        activeClasses: activeClasses ? activeClasses : Default.activeClasses,
        inactiveClasses: inactiveClasses ? inactiveClasses : Default.inactiveClasses
      });
    });
  }
  if (typeof window !== "undefined") {
    window.Accordion = Accordion;
    window.initAccordions = initAccordions;
  }

  // node_modules/flowbite/lib/esm/components/collapse/index.js
  var __assign2 = function() {
    __assign2 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign2.apply(this, arguments);
  };
  var Default2 = {
    onCollapse: function() {
    },
    onExpand: function() {
    },
    onToggle: function() {
    }
  };
  var DefaultInstanceOptions2 = {
    id: null,
    override: true
  };
  var Collapse = (
    /** @class */
    function() {
      function Collapse2(targetEl, triggerEl, options, instanceOptions) {
        if (targetEl === void 0) {
          targetEl = null;
        }
        if (triggerEl === void 0) {
          triggerEl = null;
        }
        if (options === void 0) {
          options = Default2;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions2;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : targetEl.id;
        this._targetEl = targetEl;
        this._triggerEl = triggerEl;
        this._options = __assign2(__assign2({}, Default2), options);
        this._visible = false;
        this._initialized = false;
        this.init();
        instances_default.addInstance("Collapse", this, this._instanceId, instanceOptions.override);
      }
      Collapse2.prototype.init = function() {
        var _this = this;
        if (this._triggerEl && this._targetEl && !this._initialized) {
          if (this._triggerEl.hasAttribute("aria-expanded")) {
            this._visible = this._triggerEl.getAttribute("aria-expanded") === "true";
          } else {
            this._visible = !this._targetEl.classList.contains("hidden");
          }
          this._clickHandler = function() {
            _this.toggle();
          };
          this._triggerEl.addEventListener("click", this._clickHandler);
          this._initialized = true;
        }
      };
      Collapse2.prototype.destroy = function() {
        if (this._triggerEl && this._initialized) {
          this._triggerEl.removeEventListener("click", this._clickHandler);
          this._initialized = false;
        }
      };
      Collapse2.prototype.removeInstance = function() {
        instances_default.removeInstance("Collapse", this._instanceId);
      };
      Collapse2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Collapse2.prototype.collapse = function() {
        this._targetEl.classList.add("hidden");
        if (this._triggerEl) {
          this._triggerEl.setAttribute("aria-expanded", "false");
        }
        this._visible = false;
        this._options.onCollapse(this);
      };
      Collapse2.prototype.expand = function() {
        this._targetEl.classList.remove("hidden");
        if (this._triggerEl) {
          this._triggerEl.setAttribute("aria-expanded", "true");
        }
        this._visible = true;
        this._options.onExpand(this);
      };
      Collapse2.prototype.toggle = function() {
        if (this._visible) {
          this.collapse();
        } else {
          this.expand();
        }
        this._options.onToggle(this);
      };
      Collapse2.prototype.updateOnCollapse = function(callback) {
        this._options.onCollapse = callback;
      };
      Collapse2.prototype.updateOnExpand = function(callback) {
        this._options.onExpand = callback;
      };
      Collapse2.prototype.updateOnToggle = function(callback) {
        this._options.onToggle = callback;
      };
      return Collapse2;
    }()
  );
  function initCollapses() {
    document.querySelectorAll("[data-collapse-toggle]").forEach(function($triggerEl) {
      var targetId = $triggerEl.getAttribute("data-collapse-toggle");
      var $targetEl = document.getElementById(targetId);
      if ($targetEl) {
        if (!instances_default.instanceExists("Collapse", $targetEl.getAttribute("id"))) {
          new Collapse($targetEl, $triggerEl);
        } else {
          new Collapse($targetEl, $triggerEl, {}, {
            id: $targetEl.getAttribute("id") + "_" + instances_default._generateRandomId()
          });
        }
      } else {
        console.error('The target element with id "'.concat(targetId, '" does not exist. Please check the data-collapse-toggle attribute.'));
      }
    });
  }
  if (typeof window !== "undefined") {
    window.Collapse = Collapse;
    window.initCollapses = initCollapses;
  }

  // node_modules/flowbite/lib/esm/components/carousel/index.js
  var __assign3 = function() {
    __assign3 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign3.apply(this, arguments);
  };
  var Default3 = {
    defaultPosition: 0,
    indicators: {
      items: [],
      activeClasses: "bg-white dark:bg-gray-800",
      inactiveClasses: "bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
    },
    interval: 3e3,
    onNext: function() {
    },
    onPrev: function() {
    },
    onChange: function() {
    }
  };
  var DefaultInstanceOptions3 = {
    id: null,
    override: true
  };
  var Carousel = (
    /** @class */
    function() {
      function Carousel2(carouselEl, items, options, instanceOptions) {
        if (carouselEl === void 0) {
          carouselEl = null;
        }
        if (items === void 0) {
          items = [];
        }
        if (options === void 0) {
          options = Default3;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions3;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : carouselEl.id;
        this._carouselEl = carouselEl;
        this._items = items;
        this._options = __assign3(__assign3(__assign3({}, Default3), options), { indicators: __assign3(__assign3({}, Default3.indicators), options.indicators) });
        this._activeItem = this.getItem(this._options.defaultPosition);
        this._indicators = this._options.indicators.items;
        this._intervalDuration = this._options.interval;
        this._intervalInstance = null;
        this._initialized = false;
        this.init();
        instances_default.addInstance("Carousel", this, this._instanceId, instanceOptions.override);
      }
      Carousel2.prototype.init = function() {
        var _this = this;
        if (this._items.length && !this._initialized) {
          this._items.map(function(item) {
            item.el.classList.add("absolute", "inset-0", "transition-transform", "transform");
          });
          if (this.getActiveItem()) {
            this.slideTo(this.getActiveItem().position);
          } else {
            this.slideTo(0);
          }
          this._indicators.map(function(indicator, position) {
            indicator.el.addEventListener("click", function() {
              _this.slideTo(position);
            });
          });
          this._initialized = true;
        }
      };
      Carousel2.prototype.destroy = function() {
        if (this._initialized) {
          this._initialized = false;
        }
      };
      Carousel2.prototype.removeInstance = function() {
        instances_default.removeInstance("Carousel", this._instanceId);
      };
      Carousel2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Carousel2.prototype.getItem = function(position) {
        return this._items[position];
      };
      Carousel2.prototype.slideTo = function(position) {
        var nextItem = this._items[position];
        var rotationItems = {
          left: nextItem.position === 0 ? this._items[this._items.length - 1] : this._items[nextItem.position - 1],
          middle: nextItem,
          right: nextItem.position === this._items.length - 1 ? this._items[0] : this._items[nextItem.position + 1]
        };
        this._rotate(rotationItems);
        this._setActiveItem(nextItem);
        if (this._intervalInstance) {
          this.pause();
          this.cycle();
        }
        this._options.onChange(this);
      };
      Carousel2.prototype.next = function() {
        var activeItem = this.getActiveItem();
        var nextItem = null;
        if (activeItem.position === this._items.length - 1) {
          nextItem = this._items[0];
        } else {
          nextItem = this._items[activeItem.position + 1];
        }
        this.slideTo(nextItem.position);
        this._options.onNext(this);
      };
      Carousel2.prototype.prev = function() {
        var activeItem = this.getActiveItem();
        var prevItem = null;
        if (activeItem.position === 0) {
          prevItem = this._items[this._items.length - 1];
        } else {
          prevItem = this._items[activeItem.position - 1];
        }
        this.slideTo(prevItem.position);
        this._options.onPrev(this);
      };
      Carousel2.prototype._rotate = function(rotationItems) {
        this._items.map(function(item) {
          item.el.classList.add("hidden");
        });
        if (this._items.length === 1) {
          rotationItems.middle.el.classList.remove("-translate-x-full", "translate-x-full", "translate-x-0", "hidden", "z-10");
          rotationItems.middle.el.classList.add("translate-x-0", "z-20");
          return;
        }
        rotationItems.left.el.classList.remove("-translate-x-full", "translate-x-full", "translate-x-0", "hidden", "z-20");
        rotationItems.left.el.classList.add("-translate-x-full", "z-10");
        rotationItems.middle.el.classList.remove("-translate-x-full", "translate-x-full", "translate-x-0", "hidden", "z-10");
        rotationItems.middle.el.classList.add("translate-x-0", "z-30");
        rotationItems.right.el.classList.remove("-translate-x-full", "translate-x-full", "translate-x-0", "hidden", "z-30");
        rotationItems.right.el.classList.add("translate-x-full", "z-20");
      };
      Carousel2.prototype.cycle = function() {
        var _this = this;
        if (typeof window !== "undefined") {
          this._intervalInstance = window.setInterval(function() {
            _this.next();
          }, this._intervalDuration);
        }
      };
      Carousel2.prototype.pause = function() {
        clearInterval(this._intervalInstance);
      };
      Carousel2.prototype.getActiveItem = function() {
        return this._activeItem;
      };
      Carousel2.prototype._setActiveItem = function(item) {
        var _a, _b;
        var _this = this;
        this._activeItem = item;
        var position = item.position;
        if (this._indicators.length) {
          this._indicators.map(function(indicator) {
            var _a2, _b2;
            indicator.el.setAttribute("aria-current", "false");
            (_a2 = indicator.el.classList).remove.apply(_a2, _this._options.indicators.activeClasses.split(" "));
            (_b2 = indicator.el.classList).add.apply(_b2, _this._options.indicators.inactiveClasses.split(" "));
          });
          (_a = this._indicators[position].el.classList).add.apply(_a, this._options.indicators.activeClasses.split(" "));
          (_b = this._indicators[position].el.classList).remove.apply(_b, this._options.indicators.inactiveClasses.split(" "));
          this._indicators[position].el.setAttribute("aria-current", "true");
        }
      };
      Carousel2.prototype.updateOnNext = function(callback) {
        this._options.onNext = callback;
      };
      Carousel2.prototype.updateOnPrev = function(callback) {
        this._options.onPrev = callback;
      };
      Carousel2.prototype.updateOnChange = function(callback) {
        this._options.onChange = callback;
      };
      return Carousel2;
    }()
  );
  function initCarousels() {
    document.querySelectorAll("[data-carousel]").forEach(function($carouselEl) {
      var interval = $carouselEl.getAttribute("data-carousel-interval");
      var slide = $carouselEl.getAttribute("data-carousel") === "slide" ? true : false;
      var items = [];
      var defaultPosition = 0;
      if ($carouselEl.querySelectorAll("[data-carousel-item]").length) {
        Array.from($carouselEl.querySelectorAll("[data-carousel-item]")).map(function($carouselItemEl, position) {
          items.push({
            position,
            el: $carouselItemEl
          });
          if ($carouselItemEl.getAttribute("data-carousel-item") === "active") {
            defaultPosition = position;
          }
        });
      }
      var indicators = [];
      if ($carouselEl.querySelectorAll("[data-carousel-slide-to]").length) {
        Array.from($carouselEl.querySelectorAll("[data-carousel-slide-to]")).map(function($indicatorEl) {
          indicators.push({
            position: parseInt($indicatorEl.getAttribute("data-carousel-slide-to")),
            el: $indicatorEl
          });
        });
      }
      var carousel = new Carousel($carouselEl, items, {
        defaultPosition,
        indicators: {
          items: indicators
        },
        interval: interval ? interval : Default3.interval
      });
      if (slide) {
        carousel.cycle();
      }
      var carouselNextEl = $carouselEl.querySelector("[data-carousel-next]");
      var carouselPrevEl = $carouselEl.querySelector("[data-carousel-prev]");
      if (carouselNextEl) {
        carouselNextEl.addEventListener("click", function() {
          carousel.next();
        });
      }
      if (carouselPrevEl) {
        carouselPrevEl.addEventListener("click", function() {
          carousel.prev();
        });
      }
    });
  }
  if (typeof window !== "undefined") {
    window.Carousel = Carousel;
    window.initCarousels = initCarousels;
  }

  // node_modules/flowbite/lib/esm/components/dismiss/index.js
  var __assign4 = function() {
    __assign4 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign4.apply(this, arguments);
  };
  var Default4 = {
    transition: "transition-opacity",
    duration: 300,
    timing: "ease-out",
    onHide: function() {
    }
  };
  var DefaultInstanceOptions4 = {
    id: null,
    override: true
  };
  var Dismiss = (
    /** @class */
    function() {
      function Dismiss2(targetEl, triggerEl, options, instanceOptions) {
        if (targetEl === void 0) {
          targetEl = null;
        }
        if (triggerEl === void 0) {
          triggerEl = null;
        }
        if (options === void 0) {
          options = Default4;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions4;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : targetEl.id;
        this._targetEl = targetEl;
        this._triggerEl = triggerEl;
        this._options = __assign4(__assign4({}, Default4), options);
        this._initialized = false;
        this.init();
        instances_default.addInstance("Dismiss", this, this._instanceId, instanceOptions.override);
      }
      Dismiss2.prototype.init = function() {
        var _this = this;
        if (this._triggerEl && this._targetEl && !this._initialized) {
          this._clickHandler = function() {
            _this.hide();
          };
          this._triggerEl.addEventListener("click", this._clickHandler);
          this._initialized = true;
        }
      };
      Dismiss2.prototype.destroy = function() {
        if (this._triggerEl && this._initialized) {
          this._triggerEl.removeEventListener("click", this._clickHandler);
          this._initialized = false;
        }
      };
      Dismiss2.prototype.removeInstance = function() {
        instances_default.removeInstance("Dismiss", this._instanceId);
      };
      Dismiss2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Dismiss2.prototype.hide = function() {
        var _this = this;
        this._targetEl.classList.add(this._options.transition, "duration-".concat(this._options.duration), this._options.timing, "opacity-0");
        setTimeout(function() {
          _this._targetEl.classList.add("hidden");
        }, this._options.duration);
        this._options.onHide(this, this._targetEl);
      };
      Dismiss2.prototype.updateOnHide = function(callback) {
        this._options.onHide = callback;
      };
      return Dismiss2;
    }()
  );
  function initDismisses() {
    document.querySelectorAll("[data-dismiss-target]").forEach(function($triggerEl) {
      var targetId = $triggerEl.getAttribute("data-dismiss-target");
      var $dismissEl = document.querySelector(targetId);
      if ($dismissEl) {
        new Dismiss($dismissEl, $triggerEl);
      } else {
        console.error('The dismiss element with id "'.concat(targetId, '" does not exist. Please check the data-dismiss-target attribute.'));
      }
    });
  }
  if (typeof window !== "undefined") {
    window.Dismiss = Dismiss;
    window.initDismisses = initDismisses;
  }

  // node_modules/@popperjs/core/lib/enums.js
  var top = "top";
  var bottom = "bottom";
  var right = "right";
  var left = "left";
  var auto = "auto";
  var basePlacements = [top, bottom, right, left];
  var start2 = "start";
  var end = "end";
  var clippingParents = "clippingParents";
  var viewport = "viewport";
  var popper = "popper";
  var reference = "reference";
  var variationPlacements = /* @__PURE__ */ basePlacements.reduce(function(acc, placement) {
    return acc.concat([placement + "-" + start2, placement + "-" + end]);
  }, []);
  var placements = /* @__PURE__ */ [].concat(basePlacements, [auto]).reduce(function(acc, placement) {
    return acc.concat([placement, placement + "-" + start2, placement + "-" + end]);
  }, []);
  var beforeRead = "beforeRead";
  var read = "read";
  var afterRead = "afterRead";
  var beforeMain = "beforeMain";
  var main = "main";
  var afterMain = "afterMain";
  var beforeWrite = "beforeWrite";
  var write = "write";
  var afterWrite = "afterWrite";
  var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

  // node_modules/@popperjs/core/lib/dom-utils/getNodeName.js
  function getNodeName(element) {
    return element ? (element.nodeName || "").toLowerCase() : null;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getWindow.js
  function getWindow(node) {
    if (node == null) {
      return window;
    }
    if (node.toString() !== "[object Window]") {
      var ownerDocument = node.ownerDocument;
      return ownerDocument ? ownerDocument.defaultView || window : window;
    }
    return node;
  }

  // node_modules/@popperjs/core/lib/dom-utils/instanceOf.js
  function isElement(node) {
    var OwnElement = getWindow(node).Element;
    return node instanceof OwnElement || node instanceof Element;
  }
  function isHTMLElement(node) {
    var OwnElement = getWindow(node).HTMLElement;
    return node instanceof OwnElement || node instanceof HTMLElement;
  }
  function isShadowRoot(node) {
    if (typeof ShadowRoot === "undefined") {
      return false;
    }
    var OwnElement = getWindow(node).ShadowRoot;
    return node instanceof OwnElement || node instanceof ShadowRoot;
  }

  // node_modules/@popperjs/core/lib/modifiers/applyStyles.js
  function applyStyles(_ref) {
    var state = _ref.state;
    Object.keys(state.elements).forEach(function(name) {
      var style = state.styles[name] || {};
      var attributes = state.attributes[name] || {};
      var element = state.elements[name];
      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }
      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function(name2) {
        var value = attributes[name2];
        if (value === false) {
          element.removeAttribute(name2);
        } else {
          element.setAttribute(name2, value === true ? "" : value);
        }
      });
    });
  }
  function effect3(_ref2) {
    var state = _ref2.state;
    var initialStyles = {
      popper: {
        position: state.options.strategy,
        left: "0",
        top: "0",
        margin: "0"
      },
      arrow: {
        position: "absolute"
      },
      reference: {}
    };
    Object.assign(state.elements.popper.style, initialStyles.popper);
    state.styles = initialStyles;
    if (state.elements.arrow) {
      Object.assign(state.elements.arrow.style, initialStyles.arrow);
    }
    return function() {
      Object.keys(state.elements).forEach(function(name) {
        var element = state.elements[name];
        var attributes = state.attributes[name] || {};
        var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]);
        var style = styleProperties.reduce(function(style2, property) {
          style2[property] = "";
          return style2;
        }, {});
        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        }
        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function(attribute) {
          element.removeAttribute(attribute);
        });
      });
    };
  }
  var applyStyles_default = {
    name: "applyStyles",
    enabled: true,
    phase: "write",
    fn: applyStyles,
    effect: effect3,
    requires: ["computeStyles"]
  };

  // node_modules/@popperjs/core/lib/utils/getBasePlacement.js
  function getBasePlacement(placement) {
    return placement.split("-")[0];
  }

  // node_modules/@popperjs/core/lib/utils/math.js
  var max = Math.max;
  var min = Math.min;
  var round = Math.round;

  // node_modules/@popperjs/core/lib/utils/userAgent.js
  function getUAString() {
    var uaData = navigator.userAgentData;
    if (uaData != null && uaData.brands) {
      return uaData.brands.map(function(item) {
        return item.brand + "/" + item.version;
      }).join(" ");
    }
    return navigator.userAgent;
  }

  // node_modules/@popperjs/core/lib/dom-utils/isLayoutViewport.js
  function isLayoutViewport() {
    return !/^((?!chrome|android).)*safari/i.test(getUAString());
  }

  // node_modules/@popperjs/core/lib/dom-utils/getBoundingClientRect.js
  function getBoundingClientRect(element, includeScale, isFixedStrategy) {
    if (includeScale === void 0) {
      includeScale = false;
    }
    if (isFixedStrategy === void 0) {
      isFixedStrategy = false;
    }
    var clientRect = element.getBoundingClientRect();
    var scaleX = 1;
    var scaleY = 1;
    if (includeScale && isHTMLElement(element)) {
      scaleX = element.offsetWidth > 0 ? round(clientRect.width) / element.offsetWidth || 1 : 1;
      scaleY = element.offsetHeight > 0 ? round(clientRect.height) / element.offsetHeight || 1 : 1;
    }
    var _ref = isElement(element) ? getWindow(element) : window, visualViewport = _ref.visualViewport;
    var addVisualOffsets = !isLayoutViewport() && isFixedStrategy;
    var x = (clientRect.left + (addVisualOffsets && visualViewport ? visualViewport.offsetLeft : 0)) / scaleX;
    var y3 = (clientRect.top + (addVisualOffsets && visualViewport ? visualViewport.offsetTop : 0)) / scaleY;
    var width = clientRect.width / scaleX;
    var height = clientRect.height / scaleY;
    return {
      width,
      height,
      top: y3,
      right: x + width,
      bottom: y3 + height,
      left: x,
      x,
      y: y3
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getLayoutRect.js
  function getLayoutRect(element) {
    var clientRect = getBoundingClientRect(element);
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    if (Math.abs(clientRect.width - width) <= 1) {
      width = clientRect.width;
    }
    if (Math.abs(clientRect.height - height) <= 1) {
      height = clientRect.height;
    }
    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      width,
      height
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/contains.js
  function contains(parent, child) {
    var rootNode = child.getRootNode && child.getRootNode();
    if (parent.contains(child)) {
      return true;
    } else if (rootNode && isShadowRoot(rootNode)) {
      var next = child;
      do {
        if (next && parent.isSameNode(next)) {
          return true;
        }
        next = next.parentNode || next.host;
      } while (next);
    }
    return false;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getComputedStyle.js
  function getComputedStyle2(element) {
    return getWindow(element).getComputedStyle(element);
  }

  // node_modules/@popperjs/core/lib/dom-utils/isTableElement.js
  function isTableElement(element) {
    return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getDocumentElement.js
  function getDocumentElement(element) {
    return ((isElement(element) ? element.ownerDocument : (
      // $FlowFixMe[prop-missing]
      element.document
    )) || window.document).documentElement;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getParentNode.js
  function getParentNode(element) {
    if (getNodeName(element) === "html") {
      return element;
    }
    return (
      // this is a quicker (but less type safe) way to save quite some bytes from the bundle
      // $FlowFixMe[incompatible-return]
      // $FlowFixMe[prop-missing]
      element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
      element.parentNode || // DOM Element detected
      (isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
      // $FlowFixMe[incompatible-call]: HTMLElement is a Node
      getDocumentElement(element)
    );
  }

  // node_modules/@popperjs/core/lib/dom-utils/getOffsetParent.js
  function getTrueOffsetParent(element) {
    if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
    getComputedStyle2(element).position === "fixed") {
      return null;
    }
    return element.offsetParent;
  }
  function getContainingBlock(element) {
    var isFirefox = /firefox/i.test(getUAString());
    var isIE = /Trident/i.test(getUAString());
    if (isIE && isHTMLElement(element)) {
      var elementCss = getComputedStyle2(element);
      if (elementCss.position === "fixed") {
        return null;
      }
    }
    var currentNode = getParentNode(element);
    if (isShadowRoot(currentNode)) {
      currentNode = currentNode.host;
    }
    while (isHTMLElement(currentNode) && ["html", "body"].indexOf(getNodeName(currentNode)) < 0) {
      var css = getComputedStyle2(currentNode);
      if (css.transform !== "none" || css.perspective !== "none" || css.contain === "paint" || ["transform", "perspective"].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === "filter" || isFirefox && css.filter && css.filter !== "none") {
        return currentNode;
      } else {
        currentNode = currentNode.parentNode;
      }
    }
    return null;
  }
  function getOffsetParent(element) {
    var window2 = getWindow(element);
    var offsetParent = getTrueOffsetParent(element);
    while (offsetParent && isTableElement(offsetParent) && getComputedStyle2(offsetParent).position === "static") {
      offsetParent = getTrueOffsetParent(offsetParent);
    }
    if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle2(offsetParent).position === "static")) {
      return window2;
    }
    return offsetParent || getContainingBlock(element) || window2;
  }

  // node_modules/@popperjs/core/lib/utils/getMainAxisFromPlacement.js
  function getMainAxisFromPlacement(placement) {
    return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
  }

  // node_modules/@popperjs/core/lib/utils/within.js
  function within(min2, value, max2) {
    return max(min2, min(value, max2));
  }
  function withinMaxClamp(min2, value, max2) {
    var v = within(min2, value, max2);
    return v > max2 ? max2 : v;
  }

  // node_modules/@popperjs/core/lib/utils/getFreshSideObject.js
  function getFreshSideObject() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }

  // node_modules/@popperjs/core/lib/utils/mergePaddingObject.js
  function mergePaddingObject(paddingObject) {
    return Object.assign({}, getFreshSideObject(), paddingObject);
  }

  // node_modules/@popperjs/core/lib/utils/expandToHashMap.js
  function expandToHashMap(value, keys) {
    return keys.reduce(function(hashMap, key) {
      hashMap[key] = value;
      return hashMap;
    }, {});
  }

  // node_modules/@popperjs/core/lib/modifiers/arrow.js
  var toPaddingObject = function toPaddingObject2(padding, state) {
    padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
      placement: state.placement
    })) : padding;
    return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
  };
  function arrow(_ref) {
    var _state$modifiersData$;
    var state = _ref.state, name = _ref.name, options = _ref.options;
    var arrowElement = state.elements.arrow;
    var popperOffsets2 = state.modifiersData.popperOffsets;
    var basePlacement = getBasePlacement(state.placement);
    var axis = getMainAxisFromPlacement(basePlacement);
    var isVertical = [left, right].indexOf(basePlacement) >= 0;
    var len = isVertical ? "height" : "width";
    if (!arrowElement || !popperOffsets2) {
      return;
    }
    var paddingObject = toPaddingObject(options.padding, state);
    var arrowRect = getLayoutRect(arrowElement);
    var minProp = axis === "y" ? top : left;
    var maxProp = axis === "y" ? bottom : right;
    var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets2[axis] - state.rects.popper[len];
    var startDiff = popperOffsets2[axis] - state.rects.reference[axis];
    var arrowOffsetParent = getOffsetParent(arrowElement);
    var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
    var centerToReference = endDiff / 2 - startDiff / 2;
    var min2 = paddingObject[minProp];
    var max2 = clientSize - arrowRect[len] - paddingObject[maxProp];
    var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
    var offset2 = within(min2, center, max2);
    var axisProp = axis;
    state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset2, _state$modifiersData$.centerOffset = offset2 - center, _state$modifiersData$);
  }
  function effect4(_ref2) {
    var state = _ref2.state, options = _ref2.options;
    var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
    if (arrowElement == null) {
      return;
    }
    if (typeof arrowElement === "string") {
      arrowElement = state.elements.popper.querySelector(arrowElement);
      if (!arrowElement) {
        return;
      }
    }
    if (true) {
      if (!isHTMLElement(arrowElement)) {
        console.error(['Popper: "arrow" element must be an HTMLElement (not an SVGElement).', "To use an SVG arrow, wrap it in an HTMLElement that will be used as", "the arrow."].join(" "));
      }
    }
    if (!contains(state.elements.popper, arrowElement)) {
      if (true) {
        console.error(['Popper: "arrow" modifier\'s `element` must be a child of the popper', "element."].join(" "));
      }
      return;
    }
    state.elements.arrow = arrowElement;
  }
  var arrow_default = {
    name: "arrow",
    enabled: true,
    phase: "main",
    fn: arrow,
    effect: effect4,
    requires: ["popperOffsets"],
    requiresIfExists: ["preventOverflow"]
  };

  // node_modules/@popperjs/core/lib/utils/getVariation.js
  function getVariation(placement) {
    return placement.split("-")[1];
  }

  // node_modules/@popperjs/core/lib/modifiers/computeStyles.js
  var unsetSides = {
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto"
  };
  function roundOffsetsByDPR(_ref) {
    var x = _ref.x, y3 = _ref.y;
    var win = window;
    var dpr = win.devicePixelRatio || 1;
    return {
      x: round(x * dpr) / dpr || 0,
      y: round(y3 * dpr) / dpr || 0
    };
  }
  function mapToStyles(_ref2) {
    var _Object$assign2;
    var popper2 = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, variation = _ref2.variation, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets, isFixed = _ref2.isFixed;
    var _offsets$x = offsets.x, x = _offsets$x === void 0 ? 0 : _offsets$x, _offsets$y = offsets.y, y3 = _offsets$y === void 0 ? 0 : _offsets$y;
    var _ref3 = typeof roundOffsets === "function" ? roundOffsets({
      x,
      y: y3
    }) : {
      x,
      y: y3
    };
    x = _ref3.x;
    y3 = _ref3.y;
    var hasX = offsets.hasOwnProperty("x");
    var hasY = offsets.hasOwnProperty("y");
    var sideX = left;
    var sideY = top;
    var win = window;
    if (adaptive) {
      var offsetParent = getOffsetParent(popper2);
      var heightProp = "clientHeight";
      var widthProp = "clientWidth";
      if (offsetParent === getWindow(popper2)) {
        offsetParent = getDocumentElement(popper2);
        if (getComputedStyle2(offsetParent).position !== "static" && position === "absolute") {
          heightProp = "scrollHeight";
          widthProp = "scrollWidth";
        }
      }
      offsetParent = offsetParent;
      if (placement === top || (placement === left || placement === right) && variation === end) {
        sideY = bottom;
        var offsetY = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.height : (
          // $FlowFixMe[prop-missing]
          offsetParent[heightProp]
        );
        y3 -= offsetY - popperRect.height;
        y3 *= gpuAcceleration ? 1 : -1;
      }
      if (placement === left || (placement === top || placement === bottom) && variation === end) {
        sideX = right;
        var offsetX = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.width : (
          // $FlowFixMe[prop-missing]
          offsetParent[widthProp]
        );
        x -= offsetX - popperRect.width;
        x *= gpuAcceleration ? 1 : -1;
      }
    }
    var commonStyles = Object.assign({
      position
    }, adaptive && unsetSides);
    var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
      x,
      y: y3
    }) : {
      x,
      y: y3
    };
    x = _ref4.x;
    y3 = _ref4.y;
    if (gpuAcceleration) {
      var _Object$assign;
      return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y3 + "px)" : "translate3d(" + x + "px, " + y3 + "px, 0)", _Object$assign));
    }
    return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y3 + "px" : "", _Object$assign2[sideX] = hasX ? x + "px" : "", _Object$assign2.transform = "", _Object$assign2));
  }
  function computeStyles(_ref5) {
    var state = _ref5.state, options = _ref5.options;
    var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
    if (true) {
      var transitionProperty = getComputedStyle2(state.elements.popper).transitionProperty || "";
      if (adaptive && ["transform", "top", "right", "bottom", "left"].some(function(property) {
        return transitionProperty.indexOf(property) >= 0;
      })) {
        console.warn(["Popper: Detected CSS transitions on at least one of the following", 'CSS properties: "transform", "top", "right", "bottom", "left".', "\n\n", 'Disable the "computeStyles" modifier\'s `adaptive` option to allow', "for smooth transitions, or remove these properties from the CSS", "transition declaration on the popper element if only transitioning", "opacity or background-color for example.", "\n\n", "We recommend using the popper element as a wrapper around an inner", "element that can have any CSS property transitioned for animations."].join(" "));
      }
    }
    var commonStyles = {
      placement: getBasePlacement(state.placement),
      variation: getVariation(state.placement),
      popper: state.elements.popper,
      popperRect: state.rects.popper,
      gpuAcceleration,
      isFixed: state.options.strategy === "fixed"
    };
    if (state.modifiersData.popperOffsets != null) {
      state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.popperOffsets,
        position: state.options.strategy,
        adaptive,
        roundOffsets
      })));
    }
    if (state.modifiersData.arrow != null) {
      state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.arrow,
        position: "absolute",
        adaptive: false,
        roundOffsets
      })));
    }
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-placement": state.placement
    });
  }
  var computeStyles_default = {
    name: "computeStyles",
    enabled: true,
    phase: "beforeWrite",
    fn: computeStyles,
    data: {}
  };

  // node_modules/@popperjs/core/lib/modifiers/eventListeners.js
  var passive = {
    passive: true
  };
  function effect5(_ref) {
    var state = _ref.state, instance = _ref.instance, options = _ref.options;
    var _options$scroll = options.scroll, scroll = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
    var window2 = getWindow(state.elements.popper);
    var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
    if (scroll) {
      scrollParents.forEach(function(scrollParent) {
        scrollParent.addEventListener("scroll", instance.update, passive);
      });
    }
    if (resize) {
      window2.addEventListener("resize", instance.update, passive);
    }
    return function() {
      if (scroll) {
        scrollParents.forEach(function(scrollParent) {
          scrollParent.removeEventListener("scroll", instance.update, passive);
        });
      }
      if (resize) {
        window2.removeEventListener("resize", instance.update, passive);
      }
    };
  }
  var eventListeners_default = {
    name: "eventListeners",
    enabled: true,
    phase: "write",
    fn: function fn() {
    },
    effect: effect5,
    data: {}
  };

  // node_modules/@popperjs/core/lib/utils/getOppositePlacement.js
  var hash = {
    left: "right",
    right: "left",
    bottom: "top",
    top: "bottom"
  };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, function(matched) {
      return hash[matched];
    });
  }

  // node_modules/@popperjs/core/lib/utils/getOppositeVariationPlacement.js
  var hash2 = {
    start: "end",
    end: "start"
  };
  function getOppositeVariationPlacement(placement) {
    return placement.replace(/start|end/g, function(matched) {
      return hash2[matched];
    });
  }

  // node_modules/@popperjs/core/lib/dom-utils/getWindowScroll.js
  function getWindowScroll(node) {
    var win = getWindow(node);
    var scrollLeft = win.pageXOffset;
    var scrollTop = win.pageYOffset;
    return {
      scrollLeft,
      scrollTop
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getWindowScrollBarX.js
  function getWindowScrollBarX(element) {
    return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
  }

  // node_modules/@popperjs/core/lib/dom-utils/getViewportRect.js
  function getViewportRect(element, strategy) {
    var win = getWindow(element);
    var html = getDocumentElement(element);
    var visualViewport = win.visualViewport;
    var width = html.clientWidth;
    var height = html.clientHeight;
    var x = 0;
    var y3 = 0;
    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height;
      var layoutViewport = isLayoutViewport();
      if (layoutViewport || !layoutViewport && strategy === "fixed") {
        x = visualViewport.offsetLeft;
        y3 = visualViewport.offsetTop;
      }
    }
    return {
      width,
      height,
      x: x + getWindowScrollBarX(element),
      y: y3
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getDocumentRect.js
  function getDocumentRect(element) {
    var _element$ownerDocumen;
    var html = getDocumentElement(element);
    var winScroll = getWindowScroll(element);
    var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
    var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
    var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
    var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
    var y3 = -winScroll.scrollTop;
    if (getComputedStyle2(body || html).direction === "rtl") {
      x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
    }
    return {
      width,
      height,
      x,
      y: y3
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/isScrollParent.js
  function isScrollParent(element) {
    var _getComputedStyle = getComputedStyle2(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
    return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
  }

  // node_modules/@popperjs/core/lib/dom-utils/getScrollParent.js
  function getScrollParent(node) {
    if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
      return node.ownerDocument.body;
    }
    if (isHTMLElement(node) && isScrollParent(node)) {
      return node;
    }
    return getScrollParent(getParentNode(node));
  }

  // node_modules/@popperjs/core/lib/dom-utils/listScrollParents.js
  function listScrollParents(element, list) {
    var _element$ownerDocumen;
    if (list === void 0) {
      list = [];
    }
    var scrollParent = getScrollParent(element);
    var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
    var win = getWindow(scrollParent);
    var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
    var updatedList = list.concat(target);
    return isBody ? updatedList : (
      // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
      updatedList.concat(listScrollParents(getParentNode(target)))
    );
  }

  // node_modules/@popperjs/core/lib/utils/rectToClientRect.js
  function rectToClientRect(rect) {
    return Object.assign({}, rect, {
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    });
  }

  // node_modules/@popperjs/core/lib/dom-utils/getClippingRect.js
  function getInnerBoundingClientRect(element, strategy) {
    var rect = getBoundingClientRect(element, false, strategy === "fixed");
    rect.top = rect.top + element.clientTop;
    rect.left = rect.left + element.clientLeft;
    rect.bottom = rect.top + element.clientHeight;
    rect.right = rect.left + element.clientWidth;
    rect.width = element.clientWidth;
    rect.height = element.clientHeight;
    rect.x = rect.left;
    rect.y = rect.top;
    return rect;
  }
  function getClientRectFromMixedType(element, clippingParent, strategy) {
    return clippingParent === viewport ? rectToClientRect(getViewportRect(element, strategy)) : isElement(clippingParent) ? getInnerBoundingClientRect(clippingParent, strategy) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
  }
  function getClippingParents(element) {
    var clippingParents2 = listScrollParents(getParentNode(element));
    var canEscapeClipping = ["absolute", "fixed"].indexOf(getComputedStyle2(element).position) >= 0;
    var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
    if (!isElement(clipperElement)) {
      return [];
    }
    return clippingParents2.filter(function(clippingParent) {
      return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== "body";
    });
  }
  function getClippingRect(element, boundary, rootBoundary, strategy) {
    var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
    var clippingParents2 = [].concat(mainClippingParents, [rootBoundary]);
    var firstClippingParent = clippingParents2[0];
    var clippingRect = clippingParents2.reduce(function(accRect, clippingParent) {
      var rect = getClientRectFromMixedType(element, clippingParent, strategy);
      accRect.top = max(rect.top, accRect.top);
      accRect.right = min(rect.right, accRect.right);
      accRect.bottom = min(rect.bottom, accRect.bottom);
      accRect.left = max(rect.left, accRect.left);
      return accRect;
    }, getClientRectFromMixedType(element, firstClippingParent, strategy));
    clippingRect.width = clippingRect.right - clippingRect.left;
    clippingRect.height = clippingRect.bottom - clippingRect.top;
    clippingRect.x = clippingRect.left;
    clippingRect.y = clippingRect.top;
    return clippingRect;
  }

  // node_modules/@popperjs/core/lib/utils/computeOffsets.js
  function computeOffsets(_ref) {
    var reference2 = _ref.reference, element = _ref.element, placement = _ref.placement;
    var basePlacement = placement ? getBasePlacement(placement) : null;
    var variation = placement ? getVariation(placement) : null;
    var commonX = reference2.x + reference2.width / 2 - element.width / 2;
    var commonY = reference2.y + reference2.height / 2 - element.height / 2;
    var offsets;
    switch (basePlacement) {
      case top:
        offsets = {
          x: commonX,
          y: reference2.y - element.height
        };
        break;
      case bottom:
        offsets = {
          x: commonX,
          y: reference2.y + reference2.height
        };
        break;
      case right:
        offsets = {
          x: reference2.x + reference2.width,
          y: commonY
        };
        break;
      case left:
        offsets = {
          x: reference2.x - element.width,
          y: commonY
        };
        break;
      default:
        offsets = {
          x: reference2.x,
          y: reference2.y
        };
    }
    var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
    if (mainAxis != null) {
      var len = mainAxis === "y" ? "height" : "width";
      switch (variation) {
        case start2:
          offsets[mainAxis] = offsets[mainAxis] - (reference2[len] / 2 - element[len] / 2);
          break;
        case end:
          offsets[mainAxis] = offsets[mainAxis] + (reference2[len] / 2 - element[len] / 2);
          break;
        default:
      }
    }
    return offsets;
  }

  // node_modules/@popperjs/core/lib/utils/detectOverflow.js
  function detectOverflow(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$strategy = _options.strategy, strategy = _options$strategy === void 0 ? state.strategy : _options$strategy, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
    var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
    var altContext = elementContext === popper ? reference : popper;
    var popperRect = state.rects.popper;
    var element = state.elements[altBoundary ? altContext : elementContext];
    var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary, strategy);
    var referenceClientRect = getBoundingClientRect(state.elements.reference);
    var popperOffsets2 = computeOffsets({
      reference: referenceClientRect,
      element: popperRect,
      strategy: "absolute",
      placement
    });
    var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets2));
    var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
    var overflowOffsets = {
      top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
      bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
      left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
      right: elementClientRect.right - clippingClientRect.right + paddingObject.right
    };
    var offsetData = state.modifiersData.offset;
    if (elementContext === popper && offsetData) {
      var offset2 = offsetData[placement];
      Object.keys(overflowOffsets).forEach(function(key) {
        var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
        var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
        overflowOffsets[key] += offset2[axis] * multiply;
      });
    }
    return overflowOffsets;
  }

  // node_modules/@popperjs/core/lib/utils/computeAutoPlacement.js
  function computeAutoPlacement(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
    var variation = getVariation(placement);
    var placements2 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement2) {
      return getVariation(placement2) === variation;
    }) : basePlacements;
    var allowedPlacements = placements2.filter(function(placement2) {
      return allowedAutoPlacements.indexOf(placement2) >= 0;
    });
    if (allowedPlacements.length === 0) {
      allowedPlacements = placements2;
      if (true) {
        console.error(["Popper: The `allowedAutoPlacements` option did not allow any", "placements. Ensure the `placement` option matches the variation", "of the allowed placements.", 'For example, "auto" cannot be used to allow "bottom-start".', 'Use "auto-start" instead.'].join(" "));
      }
    }
    var overflows = allowedPlacements.reduce(function(acc, placement2) {
      acc[placement2] = detectOverflow(state, {
        placement: placement2,
        boundary,
        rootBoundary,
        padding
      })[getBasePlacement(placement2)];
      return acc;
    }, {});
    return Object.keys(overflows).sort(function(a, b) {
      return overflows[a] - overflows[b];
    });
  }

  // node_modules/@popperjs/core/lib/modifiers/flip.js
  function getExpandedFallbackPlacements(placement) {
    if (getBasePlacement(placement) === auto) {
      return [];
    }
    var oppositePlacement = getOppositePlacement(placement);
    return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
  }
  function flip(_ref) {
    var state = _ref.state, options = _ref.options, name = _ref.name;
    if (state.modifiersData[name]._skip) {
      return;
    }
    var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
    var preferredPlacement = state.options.placement;
    var basePlacement = getBasePlacement(preferredPlacement);
    var isBasePlacement = basePlacement === preferredPlacement;
    var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
    var placements2 = [preferredPlacement].concat(fallbackPlacements).reduce(function(acc, placement2) {
      return acc.concat(getBasePlacement(placement2) === auto ? computeAutoPlacement(state, {
        placement: placement2,
        boundary,
        rootBoundary,
        padding,
        flipVariations,
        allowedAutoPlacements
      }) : placement2);
    }, []);
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var checksMap = /* @__PURE__ */ new Map();
    var makeFallbackChecks = true;
    var firstFittingPlacement = placements2[0];
    for (var i = 0; i < placements2.length; i++) {
      var placement = placements2[i];
      var _basePlacement = getBasePlacement(placement);
      var isStartVariation = getVariation(placement) === start2;
      var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
      var len = isVertical ? "width" : "height";
      var overflow = detectOverflow(state, {
        placement,
        boundary,
        rootBoundary,
        altBoundary,
        padding
      });
      var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;
      if (referenceRect[len] > popperRect[len]) {
        mainVariationSide = getOppositePlacement(mainVariationSide);
      }
      var altVariationSide = getOppositePlacement(mainVariationSide);
      var checks = [];
      if (checkMainAxis) {
        checks.push(overflow[_basePlacement] <= 0);
      }
      if (checkAltAxis) {
        checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
      }
      if (checks.every(function(check) {
        return check;
      })) {
        firstFittingPlacement = placement;
        makeFallbackChecks = false;
        break;
      }
      checksMap.set(placement, checks);
    }
    if (makeFallbackChecks) {
      var numberOfChecks = flipVariations ? 3 : 1;
      var _loop = function _loop2(_i2) {
        var fittingPlacement = placements2.find(function(placement2) {
          var checks2 = checksMap.get(placement2);
          if (checks2) {
            return checks2.slice(0, _i2).every(function(check) {
              return check;
            });
          }
        });
        if (fittingPlacement) {
          firstFittingPlacement = fittingPlacement;
          return "break";
        }
      };
      for (var _i = numberOfChecks; _i > 0; _i--) {
        var _ret = _loop(_i);
        if (_ret === "break") break;
      }
    }
    if (state.placement !== firstFittingPlacement) {
      state.modifiersData[name]._skip = true;
      state.placement = firstFittingPlacement;
      state.reset = true;
    }
  }
  var flip_default = {
    name: "flip",
    enabled: true,
    phase: "main",
    fn: flip,
    requiresIfExists: ["offset"],
    data: {
      _skip: false
    }
  };

  // node_modules/@popperjs/core/lib/modifiers/hide.js
  function getSideOffsets(overflow, rect, preventedOffsets) {
    if (preventedOffsets === void 0) {
      preventedOffsets = {
        x: 0,
        y: 0
      };
    }
    return {
      top: overflow.top - rect.height - preventedOffsets.y,
      right: overflow.right - rect.width + preventedOffsets.x,
      bottom: overflow.bottom - rect.height + preventedOffsets.y,
      left: overflow.left - rect.width - preventedOffsets.x
    };
  }
  function isAnySideFullyClipped(overflow) {
    return [top, right, bottom, left].some(function(side) {
      return overflow[side] >= 0;
    });
  }
  function hide(_ref) {
    var state = _ref.state, name = _ref.name;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var preventedOffsets = state.modifiersData.preventOverflow;
    var referenceOverflow = detectOverflow(state, {
      elementContext: "reference"
    });
    var popperAltOverflow = detectOverflow(state, {
      altBoundary: true
    });
    var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
    var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
    var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
    var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
    state.modifiersData[name] = {
      referenceClippingOffsets,
      popperEscapeOffsets,
      isReferenceHidden,
      hasPopperEscaped
    };
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-reference-hidden": isReferenceHidden,
      "data-popper-escaped": hasPopperEscaped
    });
  }
  var hide_default = {
    name: "hide",
    enabled: true,
    phase: "main",
    requiresIfExists: ["preventOverflow"],
    fn: hide
  };

  // node_modules/@popperjs/core/lib/modifiers/offset.js
  function distanceAndSkiddingToXY(placement, rects, offset2) {
    var basePlacement = getBasePlacement(placement);
    var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;
    var _ref = typeof offset2 === "function" ? offset2(Object.assign({}, rects, {
      placement
    })) : offset2, skidding = _ref[0], distance = _ref[1];
    skidding = skidding || 0;
    distance = (distance || 0) * invertDistance;
    return [left, right].indexOf(basePlacement) >= 0 ? {
      x: distance,
      y: skidding
    } : {
      x: skidding,
      y: distance
    };
  }
  function offset(_ref2) {
    var state = _ref2.state, options = _ref2.options, name = _ref2.name;
    var _options$offset = options.offset, offset2 = _options$offset === void 0 ? [0, 0] : _options$offset;
    var data2 = placements.reduce(function(acc, placement) {
      acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset2);
      return acc;
    }, {});
    var _data$state$placement = data2[state.placement], x = _data$state$placement.x, y3 = _data$state$placement.y;
    if (state.modifiersData.popperOffsets != null) {
      state.modifiersData.popperOffsets.x += x;
      state.modifiersData.popperOffsets.y += y3;
    }
    state.modifiersData[name] = data2;
  }
  var offset_default = {
    name: "offset",
    enabled: true,
    phase: "main",
    requires: ["popperOffsets"],
    fn: offset
  };

  // node_modules/@popperjs/core/lib/modifiers/popperOffsets.js
  function popperOffsets(_ref) {
    var state = _ref.state, name = _ref.name;
    state.modifiersData[name] = computeOffsets({
      reference: state.rects.reference,
      element: state.rects.popper,
      strategy: "absolute",
      placement: state.placement
    });
  }
  var popperOffsets_default = {
    name: "popperOffsets",
    enabled: true,
    phase: "read",
    fn: popperOffsets,
    data: {}
  };

  // node_modules/@popperjs/core/lib/utils/getAltAxis.js
  function getAltAxis(axis) {
    return axis === "x" ? "y" : "x";
  }

  // node_modules/@popperjs/core/lib/modifiers/preventOverflow.js
  function preventOverflow(_ref) {
    var state = _ref.state, options = _ref.options, name = _ref.name;
    var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
    var overflow = detectOverflow(state, {
      boundary,
      rootBoundary,
      padding,
      altBoundary
    });
    var basePlacement = getBasePlacement(state.placement);
    var variation = getVariation(state.placement);
    var isBasePlacement = !variation;
    var mainAxis = getMainAxisFromPlacement(basePlacement);
    var altAxis = getAltAxis(mainAxis);
    var popperOffsets2 = state.modifiersData.popperOffsets;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
      placement: state.placement
    })) : tetherOffset;
    var normalizedTetherOffsetValue = typeof tetherOffsetValue === "number" ? {
      mainAxis: tetherOffsetValue,
      altAxis: tetherOffsetValue
    } : Object.assign({
      mainAxis: 0,
      altAxis: 0
    }, tetherOffsetValue);
    var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
    var data2 = {
      x: 0,
      y: 0
    };
    if (!popperOffsets2) {
      return;
    }
    if (checkMainAxis) {
      var _offsetModifierState$;
      var mainSide = mainAxis === "y" ? top : left;
      var altSide = mainAxis === "y" ? bottom : right;
      var len = mainAxis === "y" ? "height" : "width";
      var offset2 = popperOffsets2[mainAxis];
      var min2 = offset2 + overflow[mainSide];
      var max2 = offset2 - overflow[altSide];
      var additive = tether ? -popperRect[len] / 2 : 0;
      var minLen = variation === start2 ? referenceRect[len] : popperRect[len];
      var maxLen = variation === start2 ? -popperRect[len] : -referenceRect[len];
      var arrowElement = state.elements.arrow;
      var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
        width: 0,
        height: 0
      };
      var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
      var arrowPaddingMin = arrowPaddingObject[mainSide];
      var arrowPaddingMax = arrowPaddingObject[altSide];
      var arrowLen = within(0, referenceRect[len], arrowRect[len]);
      var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
      var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
      var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
      var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
      var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
      var tetherMin = offset2 + minOffset - offsetModifierValue - clientOffset;
      var tetherMax = offset2 + maxOffset - offsetModifierValue;
      var preventedOffset = within(tether ? min(min2, tetherMin) : min2, offset2, tether ? max(max2, tetherMax) : max2);
      popperOffsets2[mainAxis] = preventedOffset;
      data2[mainAxis] = preventedOffset - offset2;
    }
    if (checkAltAxis) {
      var _offsetModifierState$2;
      var _mainSide = mainAxis === "x" ? top : left;
      var _altSide = mainAxis === "x" ? bottom : right;
      var _offset = popperOffsets2[altAxis];
      var _len = altAxis === "y" ? "height" : "width";
      var _min = _offset + overflow[_mainSide];
      var _max = _offset - overflow[_altSide];
      var isOriginSide = [top, left].indexOf(basePlacement) !== -1;
      var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;
      var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;
      var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;
      var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);
      popperOffsets2[altAxis] = _preventedOffset;
      data2[altAxis] = _preventedOffset - _offset;
    }
    state.modifiersData[name] = data2;
  }
  var preventOverflow_default = {
    name: "preventOverflow",
    enabled: true,
    phase: "main",
    fn: preventOverflow,
    requiresIfExists: ["offset"]
  };

  // node_modules/@popperjs/core/lib/dom-utils/getHTMLElementScroll.js
  function getHTMLElementScroll(element) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }

  // node_modules/@popperjs/core/lib/dom-utils/getNodeScroll.js
  function getNodeScroll(node) {
    if (node === getWindow(node) || !isHTMLElement(node)) {
      return getWindowScroll(node);
    } else {
      return getHTMLElementScroll(node);
    }
  }

  // node_modules/@popperjs/core/lib/dom-utils/getCompositeRect.js
  function isElementScaled(element) {
    var rect = element.getBoundingClientRect();
    var scaleX = round(rect.width) / element.offsetWidth || 1;
    var scaleY = round(rect.height) / element.offsetHeight || 1;
    return scaleX !== 1 || scaleY !== 1;
  }
  function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
    if (isFixed === void 0) {
      isFixed = false;
    }
    var isOffsetParentAnElement = isHTMLElement(offsetParent);
    var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
    var documentElement = getDocumentElement(offsetParent);
    var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled, isFixed);
    var scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    var offsets = {
      x: 0,
      y: 0
    };
    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
      if (getNodeName(offsetParent) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
      isScrollParent(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        offsets = getBoundingClientRect(offsetParent, true);
        offsets.x += offsetParent.clientLeft;
        offsets.y += offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }
    return {
      x: rect.left + scroll.scrollLeft - offsets.x,
      y: rect.top + scroll.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height
    };
  }

  // node_modules/@popperjs/core/lib/utils/orderModifiers.js
  function order(modifiers) {
    var map = /* @__PURE__ */ new Map();
    var visited = /* @__PURE__ */ new Set();
    var result = [];
    modifiers.forEach(function(modifier) {
      map.set(modifier.name, modifier);
    });
    function sort(modifier) {
      visited.add(modifier.name);
      var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
      requires.forEach(function(dep) {
        if (!visited.has(dep)) {
          var depModifier = map.get(dep);
          if (depModifier) {
            sort(depModifier);
          }
        }
      });
      result.push(modifier);
    }
    modifiers.forEach(function(modifier) {
      if (!visited.has(modifier.name)) {
        sort(modifier);
      }
    });
    return result;
  }
  function orderModifiers(modifiers) {
    var orderedModifiers = order(modifiers);
    return modifierPhases.reduce(function(acc, phase) {
      return acc.concat(orderedModifiers.filter(function(modifier) {
        return modifier.phase === phase;
      }));
    }, []);
  }

  // node_modules/@popperjs/core/lib/utils/debounce.js
  function debounce2(fn2) {
    var pending;
    return function() {
      if (!pending) {
        pending = new Promise(function(resolve) {
          Promise.resolve().then(function() {
            pending = void 0;
            resolve(fn2());
          });
        });
      }
      return pending;
    };
  }

  // node_modules/@popperjs/core/lib/utils/format.js
  function format(str) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    return [].concat(args).reduce(function(p, c) {
      return p.replace(/%s/, c);
    }, str);
  }

  // node_modules/@popperjs/core/lib/utils/validateModifiers.js
  var INVALID_MODIFIER_ERROR = 'Popper: modifier "%s" provided an invalid %s property, expected %s but got %s';
  var MISSING_DEPENDENCY_ERROR = 'Popper: modifier "%s" requires "%s", but "%s" modifier is not available';
  var VALID_PROPERTIES = ["name", "enabled", "phase", "fn", "effect", "requires", "options"];
  function validateModifiers(modifiers) {
    modifiers.forEach(function(modifier) {
      [].concat(Object.keys(modifier), VALID_PROPERTIES).filter(function(value, index, self) {
        return self.indexOf(value) === index;
      }).forEach(function(key) {
        switch (key) {
          case "name":
            if (typeof modifier.name !== "string") {
              console.error(format(INVALID_MODIFIER_ERROR, String(modifier.name), '"name"', '"string"', '"' + String(modifier.name) + '"'));
            }
            break;
          case "enabled":
            if (typeof modifier.enabled !== "boolean") {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"enabled"', '"boolean"', '"' + String(modifier.enabled) + '"'));
            }
            break;
          case "phase":
            if (modifierPhases.indexOf(modifier.phase) < 0) {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"phase"', "either " + modifierPhases.join(", "), '"' + String(modifier.phase) + '"'));
            }
            break;
          case "fn":
            if (typeof modifier.fn !== "function") {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"fn"', '"function"', '"' + String(modifier.fn) + '"'));
            }
            break;
          case "effect":
            if (modifier.effect != null && typeof modifier.effect !== "function") {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"effect"', '"function"', '"' + String(modifier.fn) + '"'));
            }
            break;
          case "requires":
            if (modifier.requires != null && !Array.isArray(modifier.requires)) {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requires"', '"array"', '"' + String(modifier.requires) + '"'));
            }
            break;
          case "requiresIfExists":
            if (!Array.isArray(modifier.requiresIfExists)) {
              console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requiresIfExists"', '"array"', '"' + String(modifier.requiresIfExists) + '"'));
            }
            break;
          case "options":
          case "data":
            break;
          default:
            console.error('PopperJS: an invalid property has been provided to the "' + modifier.name + '" modifier, valid properties are ' + VALID_PROPERTIES.map(function(s) {
              return '"' + s + '"';
            }).join(", ") + '; but "' + key + '" was provided.');
        }
        modifier.requires && modifier.requires.forEach(function(requirement) {
          if (modifiers.find(function(mod) {
            return mod.name === requirement;
          }) == null) {
            console.error(format(MISSING_DEPENDENCY_ERROR, String(modifier.name), requirement, requirement));
          }
        });
      });
    });
  }

  // node_modules/@popperjs/core/lib/utils/uniqueBy.js
  function uniqueBy(arr, fn2) {
    var identifiers = /* @__PURE__ */ new Set();
    return arr.filter(function(item) {
      var identifier = fn2(item);
      if (!identifiers.has(identifier)) {
        identifiers.add(identifier);
        return true;
      }
    });
  }

  // node_modules/@popperjs/core/lib/utils/mergeByName.js
  function mergeByName(modifiers) {
    var merged = modifiers.reduce(function(merged2, current) {
      var existing = merged2[current.name];
      merged2[current.name] = existing ? Object.assign({}, existing, current, {
        options: Object.assign({}, existing.options, current.options),
        data: Object.assign({}, existing.data, current.data)
      }) : current;
      return merged2;
    }, {});
    return Object.keys(merged).map(function(key) {
      return merged[key];
    });
  }

  // node_modules/@popperjs/core/lib/createPopper.js
  var INVALID_ELEMENT_ERROR = "Popper: Invalid reference or popper argument provided. They must be either a DOM element or virtual element.";
  var INFINITE_LOOP_ERROR = "Popper: An infinite loop in the modifiers cycle has been detected! The cycle has been interrupted to prevent a browser crash.";
  var DEFAULT_OPTIONS = {
    placement: "bottom",
    modifiers: [],
    strategy: "absolute"
  };
  function areValidElements() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return !args.some(function(element) {
      return !(element && typeof element.getBoundingClientRect === "function");
    });
  }
  function popperGenerator(generatorOptions) {
    if (generatorOptions === void 0) {
      generatorOptions = {};
    }
    var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers2 = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions2 = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
    return function createPopper2(reference2, popper2, options) {
      if (options === void 0) {
        options = defaultOptions2;
      }
      var state = {
        placement: "bottom",
        orderedModifiers: [],
        options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions2),
        modifiersData: {},
        elements: {
          reference: reference2,
          popper: popper2
        },
        attributes: {},
        styles: {}
      };
      var effectCleanupFns = [];
      var isDestroyed = false;
      var instance = {
        state,
        setOptions: function setOptions(setOptionsAction) {
          var options2 = typeof setOptionsAction === "function" ? setOptionsAction(state.options) : setOptionsAction;
          cleanupModifierEffects();
          state.options = Object.assign({}, defaultOptions2, state.options, options2);
          state.scrollParents = {
            reference: isElement(reference2) ? listScrollParents(reference2) : reference2.contextElement ? listScrollParents(reference2.contextElement) : [],
            popper: listScrollParents(popper2)
          };
          var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers2, state.options.modifiers)));
          state.orderedModifiers = orderedModifiers.filter(function(m3) {
            return m3.enabled;
          });
          if (true) {
            var modifiers = uniqueBy([].concat(orderedModifiers, state.options.modifiers), function(_ref) {
              var name = _ref.name;
              return name;
            });
            validateModifiers(modifiers);
            if (getBasePlacement(state.options.placement) === auto) {
              var flipModifier = state.orderedModifiers.find(function(_ref2) {
                var name = _ref2.name;
                return name === "flip";
              });
              if (!flipModifier) {
                console.error(['Popper: "auto" placements require the "flip" modifier be', "present and enabled to work."].join(" "));
              }
            }
            var _getComputedStyle = getComputedStyle2(popper2), marginTop = _getComputedStyle.marginTop, marginRight = _getComputedStyle.marginRight, marginBottom = _getComputedStyle.marginBottom, marginLeft = _getComputedStyle.marginLeft;
            if ([marginTop, marginRight, marginBottom, marginLeft].some(function(margin) {
              return parseFloat(margin);
            })) {
              console.warn(['Popper: CSS "margin" styles cannot be used to apply padding', "between the popper and its reference element or boundary.", "To replicate margin, use the `offset` modifier, as well as", "the `padding` option in the `preventOverflow` and `flip`", "modifiers."].join(" "));
            }
          }
          runModifierEffects();
          return instance.update();
        },
        // Sync update – it will always be executed, even if not necessary. This
        // is useful for low frequency updates where sync behavior simplifies the
        // logic.
        // For high frequency updates (e.g. `resize` and `scroll` events), always
        // prefer the async Popper#update method
        forceUpdate: function forceUpdate() {
          if (isDestroyed) {
            return;
          }
          var _state$elements = state.elements, reference3 = _state$elements.reference, popper3 = _state$elements.popper;
          if (!areValidElements(reference3, popper3)) {
            if (true) {
              console.error(INVALID_ELEMENT_ERROR);
            }
            return;
          }
          state.rects = {
            reference: getCompositeRect(reference3, getOffsetParent(popper3), state.options.strategy === "fixed"),
            popper: getLayoutRect(popper3)
          };
          state.reset = false;
          state.placement = state.options.placement;
          state.orderedModifiers.forEach(function(modifier) {
            return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
          });
          var __debug_loops__ = 0;
          for (var index = 0; index < state.orderedModifiers.length; index++) {
            if (true) {
              __debug_loops__ += 1;
              if (__debug_loops__ > 100) {
                console.error(INFINITE_LOOP_ERROR);
                break;
              }
            }
            if (state.reset === true) {
              state.reset = false;
              index = -1;
              continue;
            }
            var _state$orderedModifie = state.orderedModifiers[index], fn2 = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
            if (typeof fn2 === "function") {
              state = fn2({
                state,
                options: _options,
                name,
                instance
              }) || state;
            }
          }
        },
        // Async and optimistically optimized update – it will not be executed if
        // not necessary (debounced to run at most once-per-tick)
        update: debounce2(function() {
          return new Promise(function(resolve) {
            instance.forceUpdate();
            resolve(state);
          });
        }),
        destroy: function destroy() {
          cleanupModifierEffects();
          isDestroyed = true;
        }
      };
      if (!areValidElements(reference2, popper2)) {
        if (true) {
          console.error(INVALID_ELEMENT_ERROR);
        }
        return instance;
      }
      instance.setOptions(options).then(function(state2) {
        if (!isDestroyed && options.onFirstUpdate) {
          options.onFirstUpdate(state2);
        }
      });
      function runModifierEffects() {
        state.orderedModifiers.forEach(function(_ref3) {
          var name = _ref3.name, _ref3$options = _ref3.options, options2 = _ref3$options === void 0 ? {} : _ref3$options, effect6 = _ref3.effect;
          if (typeof effect6 === "function") {
            var cleanupFn = effect6({
              state,
              name,
              instance,
              options: options2
            });
            var noopFn = function noopFn2() {
            };
            effectCleanupFns.push(cleanupFn || noopFn);
          }
        });
      }
      function cleanupModifierEffects() {
        effectCleanupFns.forEach(function(fn2) {
          return fn2();
        });
        effectCleanupFns = [];
      }
      return instance;
    };
  }

  // node_modules/@popperjs/core/lib/popper.js
  var defaultModifiers = [eventListeners_default, popperOffsets_default, computeStyles_default, applyStyles_default, offset_default, flip_default, preventOverflow_default, arrow_default, hide_default];
  var createPopper = /* @__PURE__ */ popperGenerator({
    defaultModifiers
  });

  // node_modules/flowbite/lib/esm/components/dropdown/index.js
  var __assign5 = function() {
    __assign5 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign5.apply(this, arguments);
  };
  var __spreadArray = function(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar) ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
  var Default5 = {
    placement: "bottom",
    triggerType: "click",
    offsetSkidding: 0,
    offsetDistance: 10,
    delay: 300,
    ignoreClickOutsideClass: false,
    onShow: function() {
    },
    onHide: function() {
    },
    onToggle: function() {
    }
  };
  var DefaultInstanceOptions5 = {
    id: null,
    override: true
  };
  var Dropdown = (
    /** @class */
    function() {
      function Dropdown2(targetElement, triggerElement, options, instanceOptions) {
        if (targetElement === void 0) {
          targetElement = null;
        }
        if (triggerElement === void 0) {
          triggerElement = null;
        }
        if (options === void 0) {
          options = Default5;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions5;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : targetElement.id;
        this._targetEl = targetElement;
        this._triggerEl = triggerElement;
        this._options = __assign5(__assign5({}, Default5), options);
        this._popperInstance = null;
        this._visible = false;
        this._initialized = false;
        this.init();
        instances_default.addInstance("Dropdown", this, this._instanceId, instanceOptions.override);
      }
      Dropdown2.prototype.init = function() {
        if (this._triggerEl && this._targetEl && !this._initialized) {
          this._popperInstance = this._createPopperInstance();
          this._setupEventListeners();
          this._initialized = true;
        }
      };
      Dropdown2.prototype.destroy = function() {
        var _this = this;
        var triggerEvents = this._getTriggerEvents();
        if (this._options.triggerType === "click") {
          triggerEvents.showEvents.forEach(function(ev) {
            _this._triggerEl.removeEventListener(ev, _this._clickHandler);
          });
        }
        if (this._options.triggerType === "hover") {
          triggerEvents.showEvents.forEach(function(ev) {
            _this._triggerEl.removeEventListener(ev, _this._hoverShowTriggerElHandler);
            _this._targetEl.removeEventListener(ev, _this._hoverShowTargetElHandler);
          });
          triggerEvents.hideEvents.forEach(function(ev) {
            _this._triggerEl.removeEventListener(ev, _this._hoverHideHandler);
            _this._targetEl.removeEventListener(ev, _this._hoverHideHandler);
          });
        }
        this._popperInstance.destroy();
        this._initialized = false;
      };
      Dropdown2.prototype.removeInstance = function() {
        instances_default.removeInstance("Dropdown", this._instanceId);
      };
      Dropdown2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Dropdown2.prototype._setupEventListeners = function() {
        var _this = this;
        var triggerEvents = this._getTriggerEvents();
        this._clickHandler = function() {
          _this.toggle();
        };
        if (this._options.triggerType === "click") {
          triggerEvents.showEvents.forEach(function(ev) {
            _this._triggerEl.addEventListener(ev, _this._clickHandler);
          });
        }
        this._hoverShowTriggerElHandler = function(ev) {
          if (ev.type === "click") {
            _this.toggle();
          } else {
            setTimeout(function() {
              _this.show();
            }, _this._options.delay);
          }
        };
        this._hoverShowTargetElHandler = function() {
          _this.show();
        };
        this._hoverHideHandler = function() {
          setTimeout(function() {
            if (!_this._targetEl.matches(":hover")) {
              _this.hide();
            }
          }, _this._options.delay);
        };
        if (this._options.triggerType === "hover") {
          triggerEvents.showEvents.forEach(function(ev) {
            _this._triggerEl.addEventListener(ev, _this._hoverShowTriggerElHandler);
            _this._targetEl.addEventListener(ev, _this._hoverShowTargetElHandler);
          });
          triggerEvents.hideEvents.forEach(function(ev) {
            _this._triggerEl.addEventListener(ev, _this._hoverHideHandler);
            _this._targetEl.addEventListener(ev, _this._hoverHideHandler);
          });
        }
      };
      Dropdown2.prototype._createPopperInstance = function() {
        return createPopper(this._triggerEl, this._targetEl, {
          placement: this._options.placement,
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [
                  this._options.offsetSkidding,
                  this._options.offsetDistance
                ]
              }
            }
          ]
        });
      };
      Dropdown2.prototype._setupClickOutsideListener = function() {
        var _this = this;
        this._clickOutsideEventListener = function(ev) {
          _this._handleClickOutside(ev, _this._targetEl);
        };
        document.body.addEventListener("click", this._clickOutsideEventListener, true);
      };
      Dropdown2.prototype._removeClickOutsideListener = function() {
        document.body.removeEventListener("click", this._clickOutsideEventListener, true);
      };
      Dropdown2.prototype._handleClickOutside = function(ev, targetEl) {
        var clickedEl = ev.target;
        var ignoreClickOutsideClass = this._options.ignoreClickOutsideClass;
        var isIgnored = false;
        if (ignoreClickOutsideClass) {
          var ignoredClickOutsideEls = document.querySelectorAll(".".concat(ignoreClickOutsideClass));
          ignoredClickOutsideEls.forEach(function(el) {
            if (el.contains(clickedEl)) {
              isIgnored = true;
              return;
            }
          });
        }
        if (clickedEl !== targetEl && !targetEl.contains(clickedEl) && !this._triggerEl.contains(clickedEl) && !isIgnored && this.isVisible()) {
          this.hide();
        }
      };
      Dropdown2.prototype._getTriggerEvents = function() {
        switch (this._options.triggerType) {
          case "hover":
            return {
              showEvents: ["mouseenter", "click"],
              hideEvents: ["mouseleave"]
            };
          case "click":
            return {
              showEvents: ["click"],
              hideEvents: []
            };
          case "none":
            return {
              showEvents: [],
              hideEvents: []
            };
          default:
            return {
              showEvents: ["click"],
              hideEvents: []
            };
        }
      };
      Dropdown2.prototype.toggle = function() {
        if (this.isVisible()) {
          this.hide();
        } else {
          this.show();
        }
        this._options.onToggle(this);
      };
      Dropdown2.prototype.isVisible = function() {
        return this._visible;
      };
      Dropdown2.prototype.show = function() {
        this._targetEl.classList.remove("hidden");
        this._targetEl.classList.add("block");
        this._targetEl.removeAttribute("aria-hidden");
        this._popperInstance.setOptions(function(options) {
          return __assign5(__assign5({}, options), { modifiers: __spreadArray(__spreadArray([], options.modifiers, true), [
            { name: "eventListeners", enabled: true }
          ], false) });
        });
        this._setupClickOutsideListener();
        this._popperInstance.update();
        this._visible = true;
        this._options.onShow(this);
      };
      Dropdown2.prototype.hide = function() {
        this._targetEl.classList.remove("block");
        this._targetEl.classList.add("hidden");
        this._targetEl.setAttribute("aria-hidden", "true");
        this._popperInstance.setOptions(function(options) {
          return __assign5(__assign5({}, options), { modifiers: __spreadArray(__spreadArray([], options.modifiers, true), [
            { name: "eventListeners", enabled: false }
          ], false) });
        });
        this._visible = false;
        this._removeClickOutsideListener();
        this._options.onHide(this);
      };
      Dropdown2.prototype.updateOnShow = function(callback) {
        this._options.onShow = callback;
      };
      Dropdown2.prototype.updateOnHide = function(callback) {
        this._options.onHide = callback;
      };
      Dropdown2.prototype.updateOnToggle = function(callback) {
        this._options.onToggle = callback;
      };
      return Dropdown2;
    }()
  );
  function initDropdowns() {
    document.querySelectorAll("[data-dropdown-toggle]").forEach(function($triggerEl) {
      var dropdownId = $triggerEl.getAttribute("data-dropdown-toggle");
      var $dropdownEl = document.getElementById(dropdownId);
      if ($dropdownEl) {
        var placement = $triggerEl.getAttribute("data-dropdown-placement");
        var offsetSkidding = $triggerEl.getAttribute("data-dropdown-offset-skidding");
        var offsetDistance = $triggerEl.getAttribute("data-dropdown-offset-distance");
        var triggerType = $triggerEl.getAttribute("data-dropdown-trigger");
        var delay = $triggerEl.getAttribute("data-dropdown-delay");
        var ignoreClickOutsideClass = $triggerEl.getAttribute("data-dropdown-ignore-click-outside-class");
        new Dropdown($dropdownEl, $triggerEl, {
          placement: placement ? placement : Default5.placement,
          triggerType: triggerType ? triggerType : Default5.triggerType,
          offsetSkidding: offsetSkidding ? parseInt(offsetSkidding) : Default5.offsetSkidding,
          offsetDistance: offsetDistance ? parseInt(offsetDistance) : Default5.offsetDistance,
          delay: delay ? parseInt(delay) : Default5.delay,
          ignoreClickOutsideClass: ignoreClickOutsideClass ? ignoreClickOutsideClass : Default5.ignoreClickOutsideClass
        });
      } else {
        console.error('The dropdown element with id "'.concat(dropdownId, '" does not exist. Please check the data-dropdown-toggle attribute.'));
      }
    });
  }
  if (typeof window !== "undefined") {
    window.Dropdown = Dropdown;
    window.initDropdowns = initDropdowns;
  }

  // node_modules/flowbite/lib/esm/components/modal/index.js
  var __assign6 = function() {
    __assign6 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign6.apply(this, arguments);
  };
  var Default6 = {
    placement: "center",
    backdropClasses: "bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40",
    backdrop: "dynamic",
    closable: true,
    onHide: function() {
    },
    onShow: function() {
    },
    onToggle: function() {
    }
  };
  var DefaultInstanceOptions6 = {
    id: null,
    override: true
  };
  var Modal = (
    /** @class */
    function() {
      function Modal2(targetEl, options, instanceOptions) {
        if (targetEl === void 0) {
          targetEl = null;
        }
        if (options === void 0) {
          options = Default6;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions6;
        }
        this._eventListenerInstances = [];
        this._instanceId = instanceOptions.id ? instanceOptions.id : targetEl.id;
        this._targetEl = targetEl;
        this._options = __assign6(__assign6({}, Default6), options);
        this._isHidden = true;
        this._backdropEl = null;
        this._initialized = false;
        this.init();
        instances_default.addInstance("Modal", this, this._instanceId, instanceOptions.override);
      }
      Modal2.prototype.init = function() {
        var _this = this;
        if (this._targetEl && !this._initialized) {
          this._getPlacementClasses().map(function(c) {
            _this._targetEl.classList.add(c);
          });
          this._initialized = true;
        }
      };
      Modal2.prototype.destroy = function() {
        if (this._initialized) {
          this.removeAllEventListenerInstances();
          this._destroyBackdropEl();
          this._initialized = false;
        }
      };
      Modal2.prototype.removeInstance = function() {
        instances_default.removeInstance("Modal", this._instanceId);
      };
      Modal2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Modal2.prototype._createBackdrop = function() {
        var _a;
        if (this._isHidden) {
          var backdropEl = document.createElement("div");
          (_a = backdropEl.classList).add.apply(_a, this._options.backdropClasses.split(" "));
          document.querySelector("body").append(backdropEl);
          this._backdropEl = backdropEl;
        }
      };
      Modal2.prototype._destroyBackdropEl = function() {
        if (!this._isHidden && this._backdropEl) {
          this._backdropEl.remove();
          this._backdropEl = null;
        }
      };
      Modal2.prototype._setupModalCloseEventListeners = function() {
        var _this = this;
        if (this._options.backdrop === "dynamic") {
          this._clickOutsideEventListener = function(ev) {
            _this._handleOutsideClick(ev.target);
          };
          this._targetEl.addEventListener("click", this._clickOutsideEventListener, true);
        }
        this._keydownEventListener = function(ev) {
          if (ev.key === "Escape") {
            _this.hide();
          }
        };
        document.body.addEventListener("keydown", this._keydownEventListener, true);
      };
      Modal2.prototype._removeModalCloseEventListeners = function() {
        if (this._options.backdrop === "dynamic") {
          this._targetEl.removeEventListener("click", this._clickOutsideEventListener, true);
        }
        document.body.removeEventListener("keydown", this._keydownEventListener, true);
      };
      Modal2.prototype._handleOutsideClick = function(target) {
        if (target === this._targetEl || target === this._backdropEl && this.isVisible()) {
          this.hide();
        }
      };
      Modal2.prototype._getPlacementClasses = function() {
        switch (this._options.placement) {
          // top
          case "top-left":
            return ["justify-start", "items-start"];
          case "top-center":
            return ["justify-center", "items-start"];
          case "top-right":
            return ["justify-end", "items-start"];
          // center
          case "center-left":
            return ["justify-start", "items-center"];
          case "center":
            return ["justify-center", "items-center"];
          case "center-right":
            return ["justify-end", "items-center"];
          // bottom
          case "bottom-left":
            return ["justify-start", "items-end"];
          case "bottom-center":
            return ["justify-center", "items-end"];
          case "bottom-right":
            return ["justify-end", "items-end"];
          default:
            return ["justify-center", "items-center"];
        }
      };
      Modal2.prototype.toggle = function() {
        if (this._isHidden) {
          this.show();
        } else {
          this.hide();
        }
        this._options.onToggle(this);
      };
      Modal2.prototype.show = function() {
        if (this.isHidden) {
          this._targetEl.classList.add("flex");
          this._targetEl.classList.remove("hidden");
          this._targetEl.setAttribute("aria-modal", "true");
          this._targetEl.setAttribute("role", "dialog");
          this._targetEl.removeAttribute("aria-hidden");
          this._createBackdrop();
          this._isHidden = false;
          if (this._options.closable) {
            this._setupModalCloseEventListeners();
          }
          document.body.classList.add("overflow-hidden");
          this._options.onShow(this);
        }
      };
      Modal2.prototype.hide = function() {
        if (this.isVisible) {
          this._targetEl.classList.add("hidden");
          this._targetEl.classList.remove("flex");
          this._targetEl.setAttribute("aria-hidden", "true");
          this._targetEl.removeAttribute("aria-modal");
          this._targetEl.removeAttribute("role");
          this._destroyBackdropEl();
          this._isHidden = true;
          document.body.classList.remove("overflow-hidden");
          if (this._options.closable) {
            this._removeModalCloseEventListeners();
          }
          this._options.onHide(this);
        }
      };
      Modal2.prototype.isVisible = function() {
        return !this._isHidden;
      };
      Modal2.prototype.isHidden = function() {
        return this._isHidden;
      };
      Modal2.prototype.addEventListenerInstance = function(element, type, handler3) {
        this._eventListenerInstances.push({
          element,
          type,
          handler: handler3
        });
      };
      Modal2.prototype.removeAllEventListenerInstances = function() {
        this._eventListenerInstances.map(function(eventListenerInstance) {
          eventListenerInstance.element.removeEventListener(eventListenerInstance.type, eventListenerInstance.handler);
        });
        this._eventListenerInstances = [];
      };
      Modal2.prototype.getAllEventListenerInstances = function() {
        return this._eventListenerInstances;
      };
      Modal2.prototype.updateOnShow = function(callback) {
        this._options.onShow = callback;
      };
      Modal2.prototype.updateOnHide = function(callback) {
        this._options.onHide = callback;
      };
      Modal2.prototype.updateOnToggle = function(callback) {
        this._options.onToggle = callback;
      };
      return Modal2;
    }()
  );
  function initModals() {
    document.querySelectorAll("[data-modal-target]").forEach(function($triggerEl) {
      var modalId = $triggerEl.getAttribute("data-modal-target");
      var $modalEl = document.getElementById(modalId);
      if ($modalEl) {
        var placement = $modalEl.getAttribute("data-modal-placement");
        var backdrop = $modalEl.getAttribute("data-modal-backdrop");
        new Modal($modalEl, {
          placement: placement ? placement : Default6.placement,
          backdrop: backdrop ? backdrop : Default6.backdrop
        });
      } else {
        console.error("Modal with id ".concat(modalId, " does not exist. Are you sure that the data-modal-target attribute points to the correct modal id?."));
      }
    });
    document.querySelectorAll("[data-modal-toggle]").forEach(function($triggerEl) {
      var modalId = $triggerEl.getAttribute("data-modal-toggle");
      var $modalEl = document.getElementById(modalId);
      if ($modalEl) {
        var modal_1 = instances_default.getInstance("Modal", modalId);
        if (modal_1) {
          var toggleModal = function() {
            modal_1.toggle();
          };
          $triggerEl.addEventListener("click", toggleModal);
          modal_1.addEventListenerInstance($triggerEl, "click", toggleModal);
        } else {
          console.error("Modal with id ".concat(modalId, " has not been initialized. Please initialize it using the data-modal-target attribute."));
        }
      } else {
        console.error("Modal with id ".concat(modalId, " does not exist. Are you sure that the data-modal-toggle attribute points to the correct modal id?"));
      }
    });
    document.querySelectorAll("[data-modal-show]").forEach(function($triggerEl) {
      var modalId = $triggerEl.getAttribute("data-modal-show");
      var $modalEl = document.getElementById(modalId);
      if ($modalEl) {
        var modal_2 = instances_default.getInstance("Modal", modalId);
        if (modal_2) {
          var showModal = function() {
            modal_2.show();
          };
          $triggerEl.addEventListener("click", showModal);
          modal_2.addEventListenerInstance($triggerEl, "click", showModal);
        } else {
          console.error("Modal with id ".concat(modalId, " has not been initialized. Please initialize it using the data-modal-target attribute."));
        }
      } else {
        console.error("Modal with id ".concat(modalId, " does not exist. Are you sure that the data-modal-show attribute points to the correct modal id?"));
      }
    });
    document.querySelectorAll("[data-modal-hide]").forEach(function($triggerEl) {
      var modalId = $triggerEl.getAttribute("data-modal-hide");
      var $modalEl = document.getElementById(modalId);
      if ($modalEl) {
        var modal_3 = instances_default.getInstance("Modal", modalId);
        if (modal_3) {
          var hideModal = function() {
            modal_3.hide();
          };
          $triggerEl.addEventListener("click", hideModal);
          modal_3.addEventListenerInstance($triggerEl, "click", hideModal);
        } else {
          console.error("Modal with id ".concat(modalId, " has not been initialized. Please initialize it using the data-modal-target attribute."));
        }
      } else {
        console.error("Modal with id ".concat(modalId, " does not exist. Are you sure that the data-modal-hide attribute points to the correct modal id?"));
      }
    });
  }
  if (typeof window !== "undefined") {
    window.Modal = Modal;
    window.initModals = initModals;
  }

  // node_modules/flowbite/lib/esm/components/drawer/index.js
  var __assign7 = function() {
    __assign7 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign7.apply(this, arguments);
  };
  var Default7 = {
    placement: "left",
    bodyScrolling: false,
    backdrop: true,
    edge: false,
    edgeOffset: "bottom-[60px]",
    backdropClasses: "bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-30",
    onShow: function() {
    },
    onHide: function() {
    },
    onToggle: function() {
    }
  };
  var DefaultInstanceOptions7 = {
    id: null,
    override: true
  };
  var Drawer = (
    /** @class */
    function() {
      function Drawer2(targetEl, options, instanceOptions) {
        if (targetEl === void 0) {
          targetEl = null;
        }
        if (options === void 0) {
          options = Default7;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions7;
        }
        this._eventListenerInstances = [];
        this._instanceId = instanceOptions.id ? instanceOptions.id : targetEl.id;
        this._targetEl = targetEl;
        this._options = __assign7(__assign7({}, Default7), options);
        this._visible = false;
        this._initialized = false;
        this.init();
        instances_default.addInstance("Drawer", this, this._instanceId, instanceOptions.override);
      }
      Drawer2.prototype.init = function() {
        var _this = this;
        if (this._targetEl && !this._initialized) {
          this._targetEl.setAttribute("aria-hidden", "true");
          this._targetEl.classList.add("transition-transform");
          this._getPlacementClasses(this._options.placement).base.map(function(c) {
            _this._targetEl.classList.add(c);
          });
          this._handleEscapeKey = function(event) {
            if (event.key === "Escape") {
              if (_this.isVisible()) {
                _this.hide();
              }
            }
          };
          document.addEventListener("keydown", this._handleEscapeKey);
          this._initialized = true;
        }
      };
      Drawer2.prototype.destroy = function() {
        if (this._initialized) {
          this.removeAllEventListenerInstances();
          this._destroyBackdropEl();
          document.removeEventListener("keydown", this._handleEscapeKey);
          this._initialized = false;
        }
      };
      Drawer2.prototype.removeInstance = function() {
        instances_default.removeInstance("Drawer", this._instanceId);
      };
      Drawer2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Drawer2.prototype.hide = function() {
        var _this = this;
        if (this._options.edge) {
          this._getPlacementClasses(this._options.placement + "-edge").active.map(function(c) {
            _this._targetEl.classList.remove(c);
          });
          this._getPlacementClasses(this._options.placement + "-edge").inactive.map(function(c) {
            _this._targetEl.classList.add(c);
          });
        } else {
          this._getPlacementClasses(this._options.placement).active.map(function(c) {
            _this._targetEl.classList.remove(c);
          });
          this._getPlacementClasses(this._options.placement).inactive.map(function(c) {
            _this._targetEl.classList.add(c);
          });
        }
        this._targetEl.setAttribute("aria-hidden", "true");
        this._targetEl.removeAttribute("aria-modal");
        this._targetEl.removeAttribute("role");
        if (!this._options.bodyScrolling) {
          document.body.classList.remove("overflow-hidden");
        }
        if (this._options.backdrop) {
          this._destroyBackdropEl();
        }
        this._visible = false;
        this._options.onHide(this);
      };
      Drawer2.prototype.show = function() {
        var _this = this;
        if (this._options.edge) {
          this._getPlacementClasses(this._options.placement + "-edge").active.map(function(c) {
            _this._targetEl.classList.add(c);
          });
          this._getPlacementClasses(this._options.placement + "-edge").inactive.map(function(c) {
            _this._targetEl.classList.remove(c);
          });
        } else {
          this._getPlacementClasses(this._options.placement).active.map(function(c) {
            _this._targetEl.classList.add(c);
          });
          this._getPlacementClasses(this._options.placement).inactive.map(function(c) {
            _this._targetEl.classList.remove(c);
          });
        }
        this._targetEl.setAttribute("aria-modal", "true");
        this._targetEl.setAttribute("role", "dialog");
        this._targetEl.removeAttribute("aria-hidden");
        if (!this._options.bodyScrolling) {
          document.body.classList.add("overflow-hidden");
        }
        if (this._options.backdrop) {
          this._createBackdrop();
        }
        this._visible = true;
        this._options.onShow(this);
      };
      Drawer2.prototype.toggle = function() {
        if (this.isVisible()) {
          this.hide();
        } else {
          this.show();
        }
      };
      Drawer2.prototype._createBackdrop = function() {
        var _a;
        var _this = this;
        if (!this._visible) {
          var backdropEl = document.createElement("div");
          backdropEl.setAttribute("drawer-backdrop", "");
          (_a = backdropEl.classList).add.apply(_a, this._options.backdropClasses.split(" "));
          document.querySelector("body").append(backdropEl);
          backdropEl.addEventListener("click", function() {
            _this.hide();
          });
        }
      };
      Drawer2.prototype._destroyBackdropEl = function() {
        if (this._visible && document.querySelector("[drawer-backdrop]") !== null) {
          document.querySelector("[drawer-backdrop]").remove();
        }
      };
      Drawer2.prototype._getPlacementClasses = function(placement) {
        switch (placement) {
          case "top":
            return {
              base: ["top-0", "left-0", "right-0"],
              active: ["transform-none"],
              inactive: ["-translate-y-full"]
            };
          case "right":
            return {
              base: ["right-0", "top-0"],
              active: ["transform-none"],
              inactive: ["translate-x-full"]
            };
          case "bottom":
            return {
              base: ["bottom-0", "left-0", "right-0"],
              active: ["transform-none"],
              inactive: ["translate-y-full"]
            };
          case "left":
            return {
              base: ["left-0", "top-0"],
              active: ["transform-none"],
              inactive: ["-translate-x-full"]
            };
          case "bottom-edge":
            return {
              base: ["left-0", "top-0"],
              active: ["transform-none"],
              inactive: ["translate-y-full", this._options.edgeOffset]
            };
          default:
            return {
              base: ["left-0", "top-0"],
              active: ["transform-none"],
              inactive: ["-translate-x-full"]
            };
        }
      };
      Drawer2.prototype.isHidden = function() {
        return !this._visible;
      };
      Drawer2.prototype.isVisible = function() {
        return this._visible;
      };
      Drawer2.prototype.addEventListenerInstance = function(element, type, handler3) {
        this._eventListenerInstances.push({
          element,
          type,
          handler: handler3
        });
      };
      Drawer2.prototype.removeAllEventListenerInstances = function() {
        this._eventListenerInstances.map(function(eventListenerInstance) {
          eventListenerInstance.element.removeEventListener(eventListenerInstance.type, eventListenerInstance.handler);
        });
        this._eventListenerInstances = [];
      };
      Drawer2.prototype.getAllEventListenerInstances = function() {
        return this._eventListenerInstances;
      };
      Drawer2.prototype.updateOnShow = function(callback) {
        this._options.onShow = callback;
      };
      Drawer2.prototype.updateOnHide = function(callback) {
        this._options.onHide = callback;
      };
      Drawer2.prototype.updateOnToggle = function(callback) {
        this._options.onToggle = callback;
      };
      return Drawer2;
    }()
  );
  function initDrawers() {
    document.querySelectorAll("[data-drawer-target]").forEach(function($triggerEl) {
      var drawerId = $triggerEl.getAttribute("data-drawer-target");
      var $drawerEl = document.getElementById(drawerId);
      if ($drawerEl) {
        var placement = $triggerEl.getAttribute("data-drawer-placement");
        var bodyScrolling = $triggerEl.getAttribute("data-drawer-body-scrolling");
        var backdrop = $triggerEl.getAttribute("data-drawer-backdrop");
        var edge = $triggerEl.getAttribute("data-drawer-edge");
        var edgeOffset = $triggerEl.getAttribute("data-drawer-edge-offset");
        new Drawer($drawerEl, {
          placement: placement ? placement : Default7.placement,
          bodyScrolling: bodyScrolling ? bodyScrolling === "true" ? true : false : Default7.bodyScrolling,
          backdrop: backdrop ? backdrop === "true" ? true : false : Default7.backdrop,
          edge: edge ? edge === "true" ? true : false : Default7.edge,
          edgeOffset: edgeOffset ? edgeOffset : Default7.edgeOffset
        });
      } else {
        console.error("Drawer with id ".concat(drawerId, " not found. Are you sure that the data-drawer-target attribute points to the correct drawer id?"));
      }
    });
    document.querySelectorAll("[data-drawer-toggle]").forEach(function($triggerEl) {
      var drawerId = $triggerEl.getAttribute("data-drawer-toggle");
      var $drawerEl = document.getElementById(drawerId);
      if ($drawerEl) {
        var drawer_1 = instances_default.getInstance("Drawer", drawerId);
        if (drawer_1) {
          var toggleDrawer = function() {
            drawer_1.toggle();
          };
          $triggerEl.addEventListener("click", toggleDrawer);
          drawer_1.addEventListenerInstance($triggerEl, "click", toggleDrawer);
        } else {
          console.error("Drawer with id ".concat(drawerId, " has not been initialized. Please initialize it using the data-drawer-target attribute."));
        }
      } else {
        console.error("Drawer with id ".concat(drawerId, " not found. Are you sure that the data-drawer-target attribute points to the correct drawer id?"));
      }
    });
    document.querySelectorAll("[data-drawer-dismiss], [data-drawer-hide]").forEach(function($triggerEl) {
      var drawerId = $triggerEl.getAttribute("data-drawer-dismiss") ? $triggerEl.getAttribute("data-drawer-dismiss") : $triggerEl.getAttribute("data-drawer-hide");
      var $drawerEl = document.getElementById(drawerId);
      if ($drawerEl) {
        var drawer_2 = instances_default.getInstance("Drawer", drawerId);
        if (drawer_2) {
          var hideDrawer = function() {
            drawer_2.hide();
          };
          $triggerEl.addEventListener("click", hideDrawer);
          drawer_2.addEventListenerInstance($triggerEl, "click", hideDrawer);
        } else {
          console.error("Drawer with id ".concat(drawerId, " has not been initialized. Please initialize it using the data-drawer-target attribute."));
        }
      } else {
        console.error("Drawer with id ".concat(drawerId, " not found. Are you sure that the data-drawer-target attribute points to the correct drawer id"));
      }
    });
    document.querySelectorAll("[data-drawer-show]").forEach(function($triggerEl) {
      var drawerId = $triggerEl.getAttribute("data-drawer-show");
      var $drawerEl = document.getElementById(drawerId);
      if ($drawerEl) {
        var drawer_3 = instances_default.getInstance("Drawer", drawerId);
        if (drawer_3) {
          var showDrawer = function() {
            drawer_3.show();
          };
          $triggerEl.addEventListener("click", showDrawer);
          drawer_3.addEventListenerInstance($triggerEl, "click", showDrawer);
        } else {
          console.error("Drawer with id ".concat(drawerId, " has not been initialized. Please initialize it using the data-drawer-target attribute."));
        }
      } else {
        console.error("Drawer with id ".concat(drawerId, " not found. Are you sure that the data-drawer-target attribute points to the correct drawer id?"));
      }
    });
  }
  if (typeof window !== "undefined") {
    window.Drawer = Drawer;
    window.initDrawers = initDrawers;
  }

  // node_modules/flowbite/lib/esm/components/tabs/index.js
  var __assign8 = function() {
    __assign8 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign8.apply(this, arguments);
  };
  var Default8 = {
    defaultTabId: null,
    activeClasses: "text-blue-600 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-500 border-blue-600 dark:border-blue-500",
    inactiveClasses: "dark:border-transparent text-gray-500 hover:text-gray-600 dark:text-gray-400 border-gray-100 hover:border-gray-300 dark:border-gray-700 dark:hover:text-gray-300",
    onShow: function() {
    }
  };
  var DefaultInstanceOptions8 = {
    id: null,
    override: true
  };
  var Tabs = (
    /** @class */
    function() {
      function Tabs2(tabsEl, items, options, instanceOptions) {
        if (tabsEl === void 0) {
          tabsEl = null;
        }
        if (items === void 0) {
          items = [];
        }
        if (options === void 0) {
          options = Default8;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions8;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : tabsEl.id;
        this._tabsEl = tabsEl;
        this._items = items;
        this._activeTab = options ? this.getTab(options.defaultTabId) : null;
        this._options = __assign8(__assign8({}, Default8), options);
        this._initialized = false;
        this.init();
        instances_default.addInstance("Tabs", this, this._instanceId, instanceOptions.override);
      }
      Tabs2.prototype.init = function() {
        var _this = this;
        if (this._items.length && !this._initialized) {
          if (!this._activeTab) {
            this.setActiveTab(this._items[0]);
          }
          this.show(this._activeTab.id, true);
          this._items.map(function(tab) {
            tab.triggerEl.addEventListener("click", function(event) {
              event.preventDefault();
              _this.show(tab.id);
            });
          });
        }
      };
      Tabs2.prototype.destroy = function() {
        if (this._initialized) {
          this._initialized = false;
        }
      };
      Tabs2.prototype.removeInstance = function() {
        this.destroy();
        instances_default.removeInstance("Tabs", this._instanceId);
      };
      Tabs2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Tabs2.prototype.getActiveTab = function() {
        return this._activeTab;
      };
      Tabs2.prototype.setActiveTab = function(tab) {
        this._activeTab = tab;
      };
      Tabs2.prototype.getTab = function(id) {
        return this._items.filter(function(t) {
          return t.id === id;
        })[0];
      };
      Tabs2.prototype.show = function(id, forceShow) {
        var _a, _b;
        var _this = this;
        if (forceShow === void 0) {
          forceShow = false;
        }
        var tab = this.getTab(id);
        if (tab === this._activeTab && !forceShow) {
          return;
        }
        this._items.map(function(t) {
          var _a2, _b2;
          if (t !== tab) {
            (_a2 = t.triggerEl.classList).remove.apply(_a2, _this._options.activeClasses.split(" "));
            (_b2 = t.triggerEl.classList).add.apply(_b2, _this._options.inactiveClasses.split(" "));
            t.targetEl.classList.add("hidden");
            t.triggerEl.setAttribute("aria-selected", "false");
          }
        });
        (_a = tab.triggerEl.classList).add.apply(_a, this._options.activeClasses.split(" "));
        (_b = tab.triggerEl.classList).remove.apply(_b, this._options.inactiveClasses.split(" "));
        tab.triggerEl.setAttribute("aria-selected", "true");
        tab.targetEl.classList.remove("hidden");
        this.setActiveTab(tab);
        this._options.onShow(this, tab);
      };
      Tabs2.prototype.updateOnShow = function(callback) {
        this._options.onShow = callback;
      };
      return Tabs2;
    }()
  );
  function initTabs() {
    document.querySelectorAll("[data-tabs-toggle]").forEach(function($parentEl) {
      var tabItems = [];
      var activeClasses = $parentEl.getAttribute("data-tabs-active-classes");
      var inactiveClasses = $parentEl.getAttribute("data-tabs-inactive-classes");
      var defaultTabId = null;
      $parentEl.querySelectorAll('[role="tab"]').forEach(function($triggerEl) {
        var isActive = $triggerEl.getAttribute("aria-selected") === "true";
        var tab = {
          id: $triggerEl.getAttribute("data-tabs-target"),
          triggerEl: $triggerEl,
          targetEl: document.querySelector($triggerEl.getAttribute("data-tabs-target"))
        };
        tabItems.push(tab);
        if (isActive) {
          defaultTabId = tab.id;
        }
      });
      new Tabs($parentEl, tabItems, {
        defaultTabId,
        activeClasses: activeClasses ? activeClasses : Default8.activeClasses,
        inactiveClasses: inactiveClasses ? inactiveClasses : Default8.inactiveClasses
      });
    });
  }
  if (typeof window !== "undefined") {
    window.Tabs = Tabs;
    window.initTabs = initTabs;
  }

  // node_modules/flowbite/lib/esm/components/tooltip/index.js
  var __assign9 = function() {
    __assign9 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign9.apply(this, arguments);
  };
  var __spreadArray2 = function(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar) ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
  var Default9 = {
    placement: "top",
    triggerType: "hover",
    onShow: function() {
    },
    onHide: function() {
    },
    onToggle: function() {
    }
  };
  var DefaultInstanceOptions9 = {
    id: null,
    override: true
  };
  var Tooltip = (
    /** @class */
    function() {
      function Tooltip2(targetEl, triggerEl, options, instanceOptions) {
        if (targetEl === void 0) {
          targetEl = null;
        }
        if (triggerEl === void 0) {
          triggerEl = null;
        }
        if (options === void 0) {
          options = Default9;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions9;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : targetEl.id;
        this._targetEl = targetEl;
        this._triggerEl = triggerEl;
        this._options = __assign9(__assign9({}, Default9), options);
        this._popperInstance = null;
        this._visible = false;
        this._initialized = false;
        this.init();
        instances_default.addInstance("Tooltip", this, this._instanceId, instanceOptions.override);
      }
      Tooltip2.prototype.init = function() {
        if (this._triggerEl && this._targetEl && !this._initialized) {
          this._setupEventListeners();
          this._popperInstance = this._createPopperInstance();
          this._initialized = true;
        }
      };
      Tooltip2.prototype.destroy = function() {
        var _this = this;
        if (this._initialized) {
          var triggerEvents = this._getTriggerEvents();
          triggerEvents.showEvents.forEach(function(ev) {
            _this._triggerEl.removeEventListener(ev, _this._showHandler);
          });
          triggerEvents.hideEvents.forEach(function(ev) {
            _this._triggerEl.removeEventListener(ev, _this._hideHandler);
          });
          this._removeKeydownListener();
          this._removeClickOutsideListener();
          if (this._popperInstance) {
            this._popperInstance.destroy();
          }
          this._initialized = false;
        }
      };
      Tooltip2.prototype.removeInstance = function() {
        instances_default.removeInstance("Tooltip", this._instanceId);
      };
      Tooltip2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Tooltip2.prototype._setupEventListeners = function() {
        var _this = this;
        var triggerEvents = this._getTriggerEvents();
        this._showHandler = function() {
          _this.show();
        };
        this._hideHandler = function() {
          _this.hide();
        };
        triggerEvents.showEvents.forEach(function(ev) {
          _this._triggerEl.addEventListener(ev, _this._showHandler);
        });
        triggerEvents.hideEvents.forEach(function(ev) {
          _this._triggerEl.addEventListener(ev, _this._hideHandler);
        });
      };
      Tooltip2.prototype._createPopperInstance = function() {
        return createPopper(this._triggerEl, this._targetEl, {
          placement: this._options.placement,
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 8]
              }
            }
          ]
        });
      };
      Tooltip2.prototype._getTriggerEvents = function() {
        switch (this._options.triggerType) {
          case "hover":
            return {
              showEvents: ["mouseenter", "focus"],
              hideEvents: ["mouseleave", "blur"]
            };
          case "click":
            return {
              showEvents: ["click", "focus"],
              hideEvents: ["focusout", "blur"]
            };
          case "none":
            return {
              showEvents: [],
              hideEvents: []
            };
          default:
            return {
              showEvents: ["mouseenter", "focus"],
              hideEvents: ["mouseleave", "blur"]
            };
        }
      };
      Tooltip2.prototype._setupKeydownListener = function() {
        var _this = this;
        this._keydownEventListener = function(ev) {
          if (ev.key === "Escape") {
            _this.hide();
          }
        };
        document.body.addEventListener("keydown", this._keydownEventListener, true);
      };
      Tooltip2.prototype._removeKeydownListener = function() {
        document.body.removeEventListener("keydown", this._keydownEventListener, true);
      };
      Tooltip2.prototype._setupClickOutsideListener = function() {
        var _this = this;
        this._clickOutsideEventListener = function(ev) {
          _this._handleClickOutside(ev, _this._targetEl);
        };
        document.body.addEventListener("click", this._clickOutsideEventListener, true);
      };
      Tooltip2.prototype._removeClickOutsideListener = function() {
        document.body.removeEventListener("click", this._clickOutsideEventListener, true);
      };
      Tooltip2.prototype._handleClickOutside = function(ev, targetEl) {
        var clickedEl = ev.target;
        if (clickedEl !== targetEl && !targetEl.contains(clickedEl) && !this._triggerEl.contains(clickedEl) && this.isVisible()) {
          this.hide();
        }
      };
      Tooltip2.prototype.isVisible = function() {
        return this._visible;
      };
      Tooltip2.prototype.toggle = function() {
        if (this.isVisible()) {
          this.hide();
        } else {
          this.show();
        }
      };
      Tooltip2.prototype.show = function() {
        this._targetEl.classList.remove("opacity-0", "invisible");
        this._targetEl.classList.add("opacity-100", "visible");
        this._popperInstance.setOptions(function(options) {
          return __assign9(__assign9({}, options), { modifiers: __spreadArray2(__spreadArray2([], options.modifiers, true), [
            { name: "eventListeners", enabled: true }
          ], false) });
        });
        this._setupClickOutsideListener();
        this._setupKeydownListener();
        this._popperInstance.update();
        this._visible = true;
        this._options.onShow(this);
      };
      Tooltip2.prototype.hide = function() {
        this._targetEl.classList.remove("opacity-100", "visible");
        this._targetEl.classList.add("opacity-0", "invisible");
        this._popperInstance.setOptions(function(options) {
          return __assign9(__assign9({}, options), { modifiers: __spreadArray2(__spreadArray2([], options.modifiers, true), [
            { name: "eventListeners", enabled: false }
          ], false) });
        });
        this._removeClickOutsideListener();
        this._removeKeydownListener();
        this._visible = false;
        this._options.onHide(this);
      };
      Tooltip2.prototype.updateOnShow = function(callback) {
        this._options.onShow = callback;
      };
      Tooltip2.prototype.updateOnHide = function(callback) {
        this._options.onHide = callback;
      };
      Tooltip2.prototype.updateOnToggle = function(callback) {
        this._options.onToggle = callback;
      };
      return Tooltip2;
    }()
  );
  function initTooltips() {
    document.querySelectorAll("[data-tooltip-target]").forEach(function($triggerEl) {
      var tooltipId = $triggerEl.getAttribute("data-tooltip-target");
      var $tooltipEl = document.getElementById(tooltipId);
      if ($tooltipEl) {
        var triggerType = $triggerEl.getAttribute("data-tooltip-trigger");
        var placement = $triggerEl.getAttribute("data-tooltip-placement");
        new Tooltip($tooltipEl, $triggerEl, {
          placement: placement ? placement : Default9.placement,
          triggerType: triggerType ? triggerType : Default9.triggerType
        });
      } else {
        console.error('The tooltip element with id "'.concat(tooltipId, '" does not exist. Please check the data-tooltip-target attribute.'));
      }
    });
  }
  if (typeof window !== "undefined") {
    window.Tooltip = Tooltip;
    window.initTooltips = initTooltips;
  }

  // node_modules/flowbite/lib/esm/components/popover/index.js
  var __assign10 = function() {
    __assign10 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign10.apply(this, arguments);
  };
  var __spreadArray3 = function(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar) ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
  var Default10 = {
    placement: "top",
    offset: 10,
    triggerType: "hover",
    onShow: function() {
    },
    onHide: function() {
    },
    onToggle: function() {
    }
  };
  var DefaultInstanceOptions10 = {
    id: null,
    override: true
  };
  var Popover = (
    /** @class */
    function() {
      function Popover2(targetEl, triggerEl, options, instanceOptions) {
        if (targetEl === void 0) {
          targetEl = null;
        }
        if (triggerEl === void 0) {
          triggerEl = null;
        }
        if (options === void 0) {
          options = Default10;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions10;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : targetEl.id;
        this._targetEl = targetEl;
        this._triggerEl = triggerEl;
        this._options = __assign10(__assign10({}, Default10), options);
        this._popperInstance = null;
        this._visible = false;
        this._initialized = false;
        this.init();
        instances_default.addInstance("Popover", this, instanceOptions.id ? instanceOptions.id : this._targetEl.id, instanceOptions.override);
      }
      Popover2.prototype.init = function() {
        if (this._triggerEl && this._targetEl && !this._initialized) {
          this._setupEventListeners();
          this._popperInstance = this._createPopperInstance();
          this._initialized = true;
        }
      };
      Popover2.prototype.destroy = function() {
        var _this = this;
        if (this._initialized) {
          var triggerEvents = this._getTriggerEvents();
          triggerEvents.showEvents.forEach(function(ev) {
            _this._triggerEl.removeEventListener(ev, _this._showHandler);
            _this._targetEl.removeEventListener(ev, _this._showHandler);
          });
          triggerEvents.hideEvents.forEach(function(ev) {
            _this._triggerEl.removeEventListener(ev, _this._hideHandler);
            _this._targetEl.removeEventListener(ev, _this._hideHandler);
          });
          this._removeKeydownListener();
          this._removeClickOutsideListener();
          if (this._popperInstance) {
            this._popperInstance.destroy();
          }
          this._initialized = false;
        }
      };
      Popover2.prototype.removeInstance = function() {
        instances_default.removeInstance("Popover", this._instanceId);
      };
      Popover2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Popover2.prototype._setupEventListeners = function() {
        var _this = this;
        var triggerEvents = this._getTriggerEvents();
        this._showHandler = function() {
          _this.show();
        };
        this._hideHandler = function() {
          setTimeout(function() {
            if (!_this._targetEl.matches(":hover")) {
              _this.hide();
            }
          }, 100);
        };
        triggerEvents.showEvents.forEach(function(ev) {
          _this._triggerEl.addEventListener(ev, _this._showHandler);
          _this._targetEl.addEventListener(ev, _this._showHandler);
        });
        triggerEvents.hideEvents.forEach(function(ev) {
          _this._triggerEl.addEventListener(ev, _this._hideHandler);
          _this._targetEl.addEventListener(ev, _this._hideHandler);
        });
      };
      Popover2.prototype._createPopperInstance = function() {
        return createPopper(this._triggerEl, this._targetEl, {
          placement: this._options.placement,
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, this._options.offset]
              }
            }
          ]
        });
      };
      Popover2.prototype._getTriggerEvents = function() {
        switch (this._options.triggerType) {
          case "hover":
            return {
              showEvents: ["mouseenter", "focus"],
              hideEvents: ["mouseleave", "blur"]
            };
          case "click":
            return {
              showEvents: ["click", "focus"],
              hideEvents: ["focusout", "blur"]
            };
          case "none":
            return {
              showEvents: [],
              hideEvents: []
            };
          default:
            return {
              showEvents: ["mouseenter", "focus"],
              hideEvents: ["mouseleave", "blur"]
            };
        }
      };
      Popover2.prototype._setupKeydownListener = function() {
        var _this = this;
        this._keydownEventListener = function(ev) {
          if (ev.key === "Escape") {
            _this.hide();
          }
        };
        document.body.addEventListener("keydown", this._keydownEventListener, true);
      };
      Popover2.prototype._removeKeydownListener = function() {
        document.body.removeEventListener("keydown", this._keydownEventListener, true);
      };
      Popover2.prototype._setupClickOutsideListener = function() {
        var _this = this;
        this._clickOutsideEventListener = function(ev) {
          _this._handleClickOutside(ev, _this._targetEl);
        };
        document.body.addEventListener("click", this._clickOutsideEventListener, true);
      };
      Popover2.prototype._removeClickOutsideListener = function() {
        document.body.removeEventListener("click", this._clickOutsideEventListener, true);
      };
      Popover2.prototype._handleClickOutside = function(ev, targetEl) {
        var clickedEl = ev.target;
        if (clickedEl !== targetEl && !targetEl.contains(clickedEl) && !this._triggerEl.contains(clickedEl) && this.isVisible()) {
          this.hide();
        }
      };
      Popover2.prototype.isVisible = function() {
        return this._visible;
      };
      Popover2.prototype.toggle = function() {
        if (this.isVisible()) {
          this.hide();
        } else {
          this.show();
        }
        this._options.onToggle(this);
      };
      Popover2.prototype.show = function() {
        this._targetEl.classList.remove("opacity-0", "invisible");
        this._targetEl.classList.add("opacity-100", "visible");
        this._popperInstance.setOptions(function(options) {
          return __assign10(__assign10({}, options), { modifiers: __spreadArray3(__spreadArray3([], options.modifiers, true), [
            { name: "eventListeners", enabled: true }
          ], false) });
        });
        this._setupClickOutsideListener();
        this._setupKeydownListener();
        this._popperInstance.update();
        this._visible = true;
        this._options.onShow(this);
      };
      Popover2.prototype.hide = function() {
        this._targetEl.classList.remove("opacity-100", "visible");
        this._targetEl.classList.add("opacity-0", "invisible");
        this._popperInstance.setOptions(function(options) {
          return __assign10(__assign10({}, options), { modifiers: __spreadArray3(__spreadArray3([], options.modifiers, true), [
            { name: "eventListeners", enabled: false }
          ], false) });
        });
        this._removeClickOutsideListener();
        this._removeKeydownListener();
        this._visible = false;
        this._options.onHide(this);
      };
      Popover2.prototype.updateOnShow = function(callback) {
        this._options.onShow = callback;
      };
      Popover2.prototype.updateOnHide = function(callback) {
        this._options.onHide = callback;
      };
      Popover2.prototype.updateOnToggle = function(callback) {
        this._options.onToggle = callback;
      };
      return Popover2;
    }()
  );
  function initPopovers() {
    document.querySelectorAll("[data-popover-target]").forEach(function($triggerEl) {
      var popoverID = $triggerEl.getAttribute("data-popover-target");
      var $popoverEl = document.getElementById(popoverID);
      if ($popoverEl) {
        var triggerType = $triggerEl.getAttribute("data-popover-trigger");
        var placement = $triggerEl.getAttribute("data-popover-placement");
        var offset2 = $triggerEl.getAttribute("data-popover-offset");
        new Popover($popoverEl, $triggerEl, {
          placement: placement ? placement : Default10.placement,
          offset: offset2 ? parseInt(offset2) : Default10.offset,
          triggerType: triggerType ? triggerType : Default10.triggerType
        });
      } else {
        console.error('The popover element with id "'.concat(popoverID, '" does not exist. Please check the data-popover-target attribute.'));
      }
    });
  }
  if (typeof window !== "undefined") {
    window.Popover = Popover;
    window.initPopovers = initPopovers;
  }

  // node_modules/flowbite/lib/esm/components/dial/index.js
  var __assign11 = function() {
    __assign11 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign11.apply(this, arguments);
  };
  var Default11 = {
    triggerType: "hover",
    onShow: function() {
    },
    onHide: function() {
    },
    onToggle: function() {
    }
  };
  var DefaultInstanceOptions11 = {
    id: null,
    override: true
  };
  var Dial = (
    /** @class */
    function() {
      function Dial2(parentEl, triggerEl, targetEl, options, instanceOptions) {
        if (parentEl === void 0) {
          parentEl = null;
        }
        if (triggerEl === void 0) {
          triggerEl = null;
        }
        if (targetEl === void 0) {
          targetEl = null;
        }
        if (options === void 0) {
          options = Default11;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions11;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : targetEl.id;
        this._parentEl = parentEl;
        this._triggerEl = triggerEl;
        this._targetEl = targetEl;
        this._options = __assign11(__assign11({}, Default11), options);
        this._visible = false;
        this._initialized = false;
        this.init();
        instances_default.addInstance("Dial", this, this._instanceId, instanceOptions.override);
      }
      Dial2.prototype.init = function() {
        var _this = this;
        if (this._triggerEl && this._targetEl && !this._initialized) {
          var triggerEventTypes = this._getTriggerEventTypes(this._options.triggerType);
          this._showEventHandler = function() {
            _this.show();
          };
          triggerEventTypes.showEvents.forEach(function(ev) {
            _this._triggerEl.addEventListener(ev, _this._showEventHandler);
            _this._targetEl.addEventListener(ev, _this._showEventHandler);
          });
          this._hideEventHandler = function() {
            if (!_this._parentEl.matches(":hover")) {
              _this.hide();
            }
          };
          triggerEventTypes.hideEvents.forEach(function(ev) {
            _this._parentEl.addEventListener(ev, _this._hideEventHandler);
          });
          this._initialized = true;
        }
      };
      Dial2.prototype.destroy = function() {
        var _this = this;
        if (this._initialized) {
          var triggerEventTypes = this._getTriggerEventTypes(this._options.triggerType);
          triggerEventTypes.showEvents.forEach(function(ev) {
            _this._triggerEl.removeEventListener(ev, _this._showEventHandler);
            _this._targetEl.removeEventListener(ev, _this._showEventHandler);
          });
          triggerEventTypes.hideEvents.forEach(function(ev) {
            _this._parentEl.removeEventListener(ev, _this._hideEventHandler);
          });
          this._initialized = false;
        }
      };
      Dial2.prototype.removeInstance = function() {
        instances_default.removeInstance("Dial", this._instanceId);
      };
      Dial2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Dial2.prototype.hide = function() {
        this._targetEl.classList.add("hidden");
        if (this._triggerEl) {
          this._triggerEl.setAttribute("aria-expanded", "false");
        }
        this._visible = false;
        this._options.onHide(this);
      };
      Dial2.prototype.show = function() {
        this._targetEl.classList.remove("hidden");
        if (this._triggerEl) {
          this._triggerEl.setAttribute("aria-expanded", "true");
        }
        this._visible = true;
        this._options.onShow(this);
      };
      Dial2.prototype.toggle = function() {
        if (this._visible) {
          this.hide();
        } else {
          this.show();
        }
      };
      Dial2.prototype.isHidden = function() {
        return !this._visible;
      };
      Dial2.prototype.isVisible = function() {
        return this._visible;
      };
      Dial2.prototype._getTriggerEventTypes = function(triggerType) {
        switch (triggerType) {
          case "hover":
            return {
              showEvents: ["mouseenter", "focus"],
              hideEvents: ["mouseleave", "blur"]
            };
          case "click":
            return {
              showEvents: ["click", "focus"],
              hideEvents: ["focusout", "blur"]
            };
          case "none":
            return {
              showEvents: [],
              hideEvents: []
            };
          default:
            return {
              showEvents: ["mouseenter", "focus"],
              hideEvents: ["mouseleave", "blur"]
            };
        }
      };
      Dial2.prototype.updateOnShow = function(callback) {
        this._options.onShow = callback;
      };
      Dial2.prototype.updateOnHide = function(callback) {
        this._options.onHide = callback;
      };
      Dial2.prototype.updateOnToggle = function(callback) {
        this._options.onToggle = callback;
      };
      return Dial2;
    }()
  );
  function initDials() {
    document.querySelectorAll("[data-dial-init]").forEach(function($parentEl) {
      var $triggerEl = $parentEl.querySelector("[data-dial-toggle]");
      if ($triggerEl) {
        var dialId = $triggerEl.getAttribute("data-dial-toggle");
        var $dialEl = document.getElementById(dialId);
        if ($dialEl) {
          var triggerType = $triggerEl.getAttribute("data-dial-trigger");
          new Dial($parentEl, $triggerEl, $dialEl, {
            triggerType: triggerType ? triggerType : Default11.triggerType
          });
        } else {
          console.error("Dial with id ".concat(dialId, " does not exist. Are you sure that the data-dial-toggle attribute points to the correct modal id?"));
        }
      } else {
        console.error("Dial with id ".concat($parentEl.id, " does not have a trigger element. Are you sure that the data-dial-toggle attribute exists?"));
      }
    });
  }
  if (typeof window !== "undefined") {
    window.Dial = Dial;
    window.initDials = initDials;
  }

  // node_modules/flowbite/lib/esm/components/input-counter/index.js
  var __assign12 = function() {
    __assign12 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign12.apply(this, arguments);
  };
  var Default12 = {
    minValue: null,
    maxValue: null,
    onIncrement: function() {
    },
    onDecrement: function() {
    }
  };
  var DefaultInstanceOptions12 = {
    id: null,
    override: true
  };
  var InputCounter = (
    /** @class */
    function() {
      function InputCounter2(targetEl, incrementEl, decrementEl, options, instanceOptions) {
        if (targetEl === void 0) {
          targetEl = null;
        }
        if (incrementEl === void 0) {
          incrementEl = null;
        }
        if (decrementEl === void 0) {
          decrementEl = null;
        }
        if (options === void 0) {
          options = Default12;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions12;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : targetEl.id;
        this._targetEl = targetEl;
        this._incrementEl = incrementEl;
        this._decrementEl = decrementEl;
        this._options = __assign12(__assign12({}, Default12), options);
        this._initialized = false;
        this.init();
        instances_default.addInstance("InputCounter", this, this._instanceId, instanceOptions.override);
      }
      InputCounter2.prototype.init = function() {
        var _this = this;
        if (this._targetEl && !this._initialized) {
          this._inputHandler = function(event) {
            {
              var target = event.target;
              if (!/^\d*$/.test(target.value)) {
                target.value = target.value.replace(/[^\d]/g, "");
              }
              if (_this._options.maxValue !== null && parseInt(target.value) > _this._options.maxValue) {
                target.value = _this._options.maxValue.toString();
              }
              if (_this._options.minValue !== null && parseInt(target.value) < _this._options.minValue) {
                target.value = _this._options.minValue.toString();
              }
            }
          };
          this._incrementClickHandler = function() {
            _this.increment();
          };
          this._decrementClickHandler = function() {
            _this.decrement();
          };
          this._targetEl.addEventListener("input", this._inputHandler);
          if (this._incrementEl) {
            this._incrementEl.addEventListener("click", this._incrementClickHandler);
          }
          if (this._decrementEl) {
            this._decrementEl.addEventListener("click", this._decrementClickHandler);
          }
          this._initialized = true;
        }
      };
      InputCounter2.prototype.destroy = function() {
        if (this._targetEl && this._initialized) {
          this._targetEl.removeEventListener("input", this._inputHandler);
          if (this._incrementEl) {
            this._incrementEl.removeEventListener("click", this._incrementClickHandler);
          }
          if (this._decrementEl) {
            this._decrementEl.removeEventListener("click", this._decrementClickHandler);
          }
          this._initialized = false;
        }
      };
      InputCounter2.prototype.removeInstance = function() {
        instances_default.removeInstance("InputCounter", this._instanceId);
      };
      InputCounter2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      InputCounter2.prototype.getCurrentValue = function() {
        return parseInt(this._targetEl.value) || 0;
      };
      InputCounter2.prototype.increment = function() {
        if (this._options.maxValue !== null && this.getCurrentValue() >= this._options.maxValue) {
          return;
        }
        this._targetEl.value = (this.getCurrentValue() + 1).toString();
        this._options.onIncrement(this);
      };
      InputCounter2.prototype.decrement = function() {
        if (this._options.minValue !== null && this.getCurrentValue() <= this._options.minValue) {
          return;
        }
        this._targetEl.value = (this.getCurrentValue() - 1).toString();
        this._options.onDecrement(this);
      };
      InputCounter2.prototype.updateOnIncrement = function(callback) {
        this._options.onIncrement = callback;
      };
      InputCounter2.prototype.updateOnDecrement = function(callback) {
        this._options.onDecrement = callback;
      };
      return InputCounter2;
    }()
  );
  function initInputCounters() {
    document.querySelectorAll("[data-input-counter]").forEach(function($targetEl) {
      var targetId = $targetEl.id;
      var $incrementEl = document.querySelector('[data-input-counter-increment="' + targetId + '"]');
      var $decrementEl = document.querySelector('[data-input-counter-decrement="' + targetId + '"]');
      var minValue = $targetEl.getAttribute("data-input-counter-min");
      var maxValue = $targetEl.getAttribute("data-input-counter-max");
      if ($targetEl) {
        if (!instances_default.instanceExists("InputCounter", $targetEl.getAttribute("id"))) {
          new InputCounter($targetEl, $incrementEl ? $incrementEl : null, $decrementEl ? $decrementEl : null, {
            minValue: minValue ? parseInt(minValue) : null,
            maxValue: maxValue ? parseInt(maxValue) : null
          });
        }
      } else {
        console.error('The target element with id "'.concat(targetId, '" does not exist. Please check the data-input-counter attribute.'));
      }
    });
  }
  if (typeof window !== "undefined") {
    window.InputCounter = InputCounter;
    window.initInputCounters = initInputCounters;
  }

  // node_modules/flowbite/lib/esm/components/clipboard/index.js
  var __assign13 = function() {
    __assign13 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign13.apply(this, arguments);
  };
  var Default13 = {
    htmlEntities: false,
    contentType: "input",
    onCopy: function() {
    }
  };
  var DefaultInstanceOptions13 = {
    id: null,
    override: true
  };
  var CopyClipboard = (
    /** @class */
    function() {
      function CopyClipboard2(triggerEl, targetEl, options, instanceOptions) {
        if (triggerEl === void 0) {
          triggerEl = null;
        }
        if (targetEl === void 0) {
          targetEl = null;
        }
        if (options === void 0) {
          options = Default13;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions13;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : targetEl.id;
        this._triggerEl = triggerEl;
        this._targetEl = targetEl;
        this._options = __assign13(__assign13({}, Default13), options);
        this._initialized = false;
        this.init();
        instances_default.addInstance("CopyClipboard", this, this._instanceId, instanceOptions.override);
      }
      CopyClipboard2.prototype.init = function() {
        var _this = this;
        if (this._targetEl && this._triggerEl && !this._initialized) {
          this._triggerElClickHandler = function() {
            _this.copy();
          };
          if (this._triggerEl) {
            this._triggerEl.addEventListener("click", this._triggerElClickHandler);
          }
          this._initialized = true;
        }
      };
      CopyClipboard2.prototype.destroy = function() {
        if (this._triggerEl && this._targetEl && this._initialized) {
          if (this._triggerEl) {
            this._triggerEl.removeEventListener("click", this._triggerElClickHandler);
          }
          this._initialized = false;
        }
      };
      CopyClipboard2.prototype.removeInstance = function() {
        instances_default.removeInstance("CopyClipboard", this._instanceId);
      };
      CopyClipboard2.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      CopyClipboard2.prototype.getTargetValue = function() {
        if (this._options.contentType === "input") {
          return this._targetEl.value;
        }
        if (this._options.contentType === "innerHTML") {
          return this._targetEl.innerHTML;
        }
        if (this._options.contentType === "textContent") {
          return this._targetEl.textContent.replace(/\s+/g, " ").trim();
        }
      };
      CopyClipboard2.prototype.copy = function() {
        var textToCopy = this.getTargetValue();
        if (this._options.htmlEntities) {
          textToCopy = this.decodeHTML(textToCopy);
        }
        var tempTextArea = document.createElement("textarea");
        tempTextArea.value = textToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextArea);
        this._options.onCopy(this);
        return textToCopy;
      };
      CopyClipboard2.prototype.decodeHTML = function(html) {
        var textarea = document.createElement("textarea");
        textarea.innerHTML = html;
        return textarea.textContent;
      };
      CopyClipboard2.prototype.updateOnCopyCallback = function(callback) {
        this._options.onCopy = callback;
      };
      return CopyClipboard2;
    }()
  );
  function initCopyClipboards() {
    document.querySelectorAll("[data-copy-to-clipboard-target]").forEach(function($triggerEl) {
      var targetId = $triggerEl.getAttribute("data-copy-to-clipboard-target");
      var $targetEl = document.getElementById(targetId);
      var contentType = $triggerEl.getAttribute("data-copy-to-clipboard-content-type");
      var htmlEntities = $triggerEl.getAttribute("data-copy-to-clipboard-html-entities");
      if ($targetEl) {
        if (!instances_default.instanceExists("CopyClipboard", $targetEl.getAttribute("id"))) {
          new CopyClipboard($triggerEl, $targetEl, {
            htmlEntities: htmlEntities && htmlEntities === "true" ? true : Default13.htmlEntities,
            contentType: contentType ? contentType : Default13.contentType
          });
        }
      } else {
        console.error('The target element with id "'.concat(targetId, '" does not exist. Please check the data-copy-to-clipboard-target attribute.'));
      }
    });
  }
  if (typeof window !== "undefined") {
    window.CopyClipboard = CopyClipboard;
    window.initClipboards = initCopyClipboards;
  }

  // node_modules/flowbite-datepicker/dist/main.esm.js
  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
  }
  function _assertThisInitialized(e) {
    if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return e;
  }
  function _callSuper(t, o, e) {
    return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
  }
  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }
  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
      writable: false
    }), e;
  }
  function _get() {
    return _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function(e, t, r) {
      var p = _superPropBase(e, t);
      if (p) {
        var n = Object.getOwnPropertyDescriptor(p, t);
        return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value;
      }
    }, _get.apply(null, arguments);
  }
  function _getPrototypeOf(t) {
    return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t2) {
      return t2.__proto__ || Object.getPrototypeOf(t2);
    }, _getPrototypeOf(t);
  }
  function _inherits(t, e) {
    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
    t.prototype = Object.create(e && e.prototype, {
      constructor: {
        value: t,
        writable: true,
        configurable: true
      }
    }), Object.defineProperty(t, "prototype", {
      writable: false
    }), e && _setPrototypeOf(t, e);
  }
  function _isNativeReflectConstruct() {
    try {
      var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
      }));
    } catch (t2) {
    }
    return (_isNativeReflectConstruct = function() {
      return !!t;
    })();
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e, n, i, u, a = [], f = true, o = false;
      try {
        if (i = (t = t.call(r)).next, 0 === l) {
          if (Object(t) !== t) return;
          f = false;
        } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
      } catch (r2) {
        o = true, n = r2;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _possibleConstructorReturn(t, e) {
    if (e && ("object" == typeof e || "function" == typeof e)) return e;
    if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
    return _assertThisInitialized(t);
  }
  function _setPrototypeOf(t, e) {
    return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t2, e2) {
      return t2.__proto__ = e2, t2;
    }, _setPrototypeOf(t, e);
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _superPropBase(t, o) {
    for (; !{}.hasOwnProperty.call(t, o) && null !== (t = _getPrototypeOf(t)); ) ;
    return t;
  }
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
      return typeof o2;
    } : function(o2) {
      return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
    }, _typeof(o);
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  function hasProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
  function lastItemOf(arr) {
    return arr[arr.length - 1];
  }
  function pushUnique(arr) {
    for (var _len = arguments.length, items = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      items[_key - 1] = arguments[_key];
    }
    items.forEach(function(item) {
      if (arr.includes(item)) {
        return;
      }
      arr.push(item);
    });
    return arr;
  }
  function stringToArray(str, separator) {
    return str ? str.split(separator) : [];
  }
  function isInRange(testVal, min2, max2) {
    var minOK = min2 === void 0 || testVal >= min2;
    var maxOK = max2 === void 0 || testVal <= max2;
    return minOK && maxOK;
  }
  function limitToRange(val, min2, max2) {
    if (val < min2) {
      return min2;
    }
    if (val > max2) {
      return max2;
    }
    return val;
  }
  function createTagRepeat(tagName, repeat) {
    var attributes = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var index = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
    var html = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : "";
    var openTagSrc = Object.keys(attributes).reduce(function(src, attr) {
      var val = attributes[attr];
      if (typeof val === "function") {
        val = val(index);
      }
      return "".concat(src, " ").concat(attr, '="').concat(val, '"');
    }, tagName);
    html += "<".concat(openTagSrc, "></").concat(tagName, ">");
    var next = index + 1;
    return next < repeat ? createTagRepeat(tagName, repeat, attributes, next, html) : html;
  }
  function optimizeTemplateHTML(html) {
    return html.replace(/>\s+/g, ">").replace(/\s+</, "<");
  }
  function stripTime(timeValue) {
    return new Date(timeValue).setHours(0, 0, 0, 0);
  }
  function today() {
    return (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
  }
  function dateValue() {
    switch (arguments.length) {
      case 0:
        return today();
      case 1:
        return stripTime(arguments.length <= 0 ? void 0 : arguments[0]);
    }
    var newDate = /* @__PURE__ */ new Date(0);
    newDate.setFullYear.apply(newDate, arguments);
    return newDate.setHours(0, 0, 0, 0);
  }
  function addDays(date, amount) {
    var newDate = new Date(date);
    return newDate.setDate(newDate.getDate() + amount);
  }
  function addWeeks(date, amount) {
    return addDays(date, amount * 7);
  }
  function addMonths(date, amount) {
    var newDate = new Date(date);
    var monthsToSet = newDate.getMonth() + amount;
    var expectedMonth = monthsToSet % 12;
    if (expectedMonth < 0) {
      expectedMonth += 12;
    }
    var time = newDate.setMonth(monthsToSet);
    return newDate.getMonth() !== expectedMonth ? newDate.setDate(0) : time;
  }
  function addYears(date, amount) {
    var newDate = new Date(date);
    var expectedMonth = newDate.getMonth();
    var time = newDate.setFullYear(newDate.getFullYear() + amount);
    return expectedMonth === 1 && newDate.getMonth() === 2 ? newDate.setDate(0) : time;
  }
  function dayDiff(day, from) {
    return (day - from + 7) % 7;
  }
  function dayOfTheWeekOf(baseDate, dayOfWeek) {
    var weekStart = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    var baseDay = new Date(baseDate).getDay();
    return addDays(baseDate, dayDiff(dayOfWeek, weekStart) - dayDiff(baseDay, weekStart));
  }
  function getWeek(date) {
    var thuOfTheWeek = dayOfTheWeekOf(date, 4, 1);
    var firstThu = dayOfTheWeekOf(new Date(thuOfTheWeek).setMonth(0, 4), 4, 1);
    return Math.round((thuOfTheWeek - firstThu) / 6048e5) + 1;
  }
  function startOfYearPeriod(date, years) {
    var year = new Date(date).getFullYear();
    return Math.floor(year / years) * years;
  }
  var reFormatTokens = /dd?|DD?|mm?|MM?|yy?(?:yy)?/;
  var reNonDateParts = /[\s!-/:-@[-`{-~年月日]+/;
  var knownFormats = {};
  var parseFns = {
    y: function y(date, year) {
      return new Date(date).setFullYear(parseInt(year, 10));
    },
    m: function m(date, month, locale) {
      var newDate = new Date(date);
      var monthIndex = parseInt(month, 10) - 1;
      if (isNaN(monthIndex)) {
        if (!month) {
          return NaN;
        }
        var monthName = month.toLowerCase();
        var compareNames = function compareNames2(name) {
          return name.toLowerCase().startsWith(monthName);
        };
        monthIndex = locale.monthsShort.findIndex(compareNames);
        if (monthIndex < 0) {
          monthIndex = locale.months.findIndex(compareNames);
        }
        if (monthIndex < 0) {
          return NaN;
        }
      }
      newDate.setMonth(monthIndex);
      return newDate.getMonth() !== normalizeMonth(monthIndex) ? newDate.setDate(0) : newDate.getTime();
    },
    d: function d(date, day) {
      return new Date(date).setDate(parseInt(day, 10));
    }
  };
  var formatFns = {
    d: function d2(date) {
      return date.getDate();
    },
    dd: function dd(date) {
      return padZero(date.getDate(), 2);
    },
    D: function D(date, locale) {
      return locale.daysShort[date.getDay()];
    },
    DD: function DD(date, locale) {
      return locale.days[date.getDay()];
    },
    m: function m2(date) {
      return date.getMonth() + 1;
    },
    mm: function mm(date) {
      return padZero(date.getMonth() + 1, 2);
    },
    M: function M(date, locale) {
      return locale.monthsShort[date.getMonth()];
    },
    MM: function MM(date, locale) {
      return locale.months[date.getMonth()];
    },
    y: function y2(date) {
      return date.getFullYear();
    },
    yy: function yy(date) {
      return padZero(date.getFullYear(), 2).slice(-2);
    },
    yyyy: function yyyy(date) {
      return padZero(date.getFullYear(), 4);
    }
  };
  function normalizeMonth(monthIndex) {
    return monthIndex > -1 ? monthIndex % 12 : normalizeMonth(monthIndex + 12);
  }
  function padZero(num, length) {
    return num.toString().padStart(length, "0");
  }
  function parseFormatString(format2) {
    if (typeof format2 !== "string") {
      throw new Error("Invalid date format.");
    }
    if (format2 in knownFormats) {
      return knownFormats[format2];
    }
    var separators = format2.split(reFormatTokens);
    var parts = format2.match(new RegExp(reFormatTokens, "g"));
    if (separators.length === 0 || !parts) {
      throw new Error("Invalid date format.");
    }
    var partFormatters = parts.map(function(token) {
      return formatFns[token];
    });
    var partParserKeys = Object.keys(parseFns).reduce(function(keys, key) {
      var token = parts.find(function(part) {
        return part[0] !== "D" && part[0].toLowerCase() === key;
      });
      if (token) {
        keys.push(key);
      }
      return keys;
    }, []);
    return knownFormats[format2] = {
      parser: function parser(dateStr, locale) {
        var dateParts = dateStr.split(reNonDateParts).reduce(function(dtParts, part, index) {
          if (part.length > 0 && parts[index]) {
            var token = parts[index][0];
            if (token === "M") {
              dtParts.m = part;
            } else if (token !== "D") {
              dtParts[token] = part;
            }
          }
          return dtParts;
        }, {});
        return partParserKeys.reduce(function(origDate, key) {
          var newDate = parseFns[key](origDate, dateParts[key], locale);
          return isNaN(newDate) ? origDate : newDate;
        }, today());
      },
      formatter: function formatter(date, locale) {
        var dateStr = partFormatters.reduce(function(str, fn2, index) {
          return str += "".concat(separators[index]).concat(fn2(date, locale));
        }, "");
        return dateStr += lastItemOf(separators);
      }
    };
  }
  function parseDate(dateStr, format2, locale) {
    if (dateStr instanceof Date || typeof dateStr === "number") {
      var date = stripTime(dateStr);
      return isNaN(date) ? void 0 : date;
    }
    if (!dateStr) {
      return void 0;
    }
    if (dateStr === "today") {
      return today();
    }
    if (format2 && format2.toValue) {
      var _date = format2.toValue(dateStr, format2, locale);
      return isNaN(_date) ? void 0 : stripTime(_date);
    }
    return parseFormatString(format2).parser(dateStr, locale);
  }
  function formatDate(date, format2, locale) {
    if (isNaN(date) || !date && date !== 0) {
      return "";
    }
    var dateObj = typeof date === "number" ? new Date(date) : date;
    if (format2.toDisplay) {
      return format2.toDisplay(dateObj, format2, locale);
    }
    return parseFormatString(format2).formatter(dateObj, locale);
  }
  var listenerRegistry = /* @__PURE__ */ new WeakMap();
  var _EventTarget$prototyp = EventTarget.prototype;
  var addEventListener = _EventTarget$prototyp.addEventListener;
  var removeEventListener = _EventTarget$prototyp.removeEventListener;
  function registerListeners(keyObj, listeners) {
    var registered = listenerRegistry.get(keyObj);
    if (!registered) {
      registered = [];
      listenerRegistry.set(keyObj, registered);
    }
    listeners.forEach(function(listener) {
      addEventListener.call.apply(addEventListener, _toConsumableArray(listener));
      registered.push(listener);
    });
  }
  function unregisterListeners(keyObj) {
    var listeners = listenerRegistry.get(keyObj);
    if (!listeners) {
      return;
    }
    listeners.forEach(function(listener) {
      removeEventListener.call.apply(removeEventListener, _toConsumableArray(listener));
    });
    listenerRegistry["delete"](keyObj);
  }
  if (!Event.prototype.composedPath) {
    getComposedPath = function getComposedPath2(node) {
      var path = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
      path.push(node);
      var parent;
      if (node.parentNode) {
        parent = node.parentNode;
      } else if (node.host) {
        parent = node.host;
      } else if (node.defaultView) {
        parent = node.defaultView;
      }
      return parent ? getComposedPath2(parent, path) : path;
    };
    Event.prototype.composedPath = function() {
      return getComposedPath(this.target);
    };
  }
  var getComposedPath;
  function findFromPath(path, criteria, currentTarget) {
    var index = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
    var el = path[index];
    if (criteria(el)) {
      return el;
    } else if (el === currentTarget || !el.parentElement) {
      return;
    }
    return findFromPath(path, criteria, currentTarget, index + 1);
  }
  function findElementInEventPath(ev, selector) {
    var criteria = typeof selector === "function" ? selector : function(el) {
      return el.matches(selector);
    };
    return findFromPath(ev.composedPath(), criteria, ev.currentTarget);
  }
  var locales = {
    en: {
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      today: "Today",
      clear: "Clear",
      titleFormat: "MM y"
    }
  };
  var defaultOptions = {
    autohide: false,
    beforeShowDay: null,
    beforeShowDecade: null,
    beforeShowMonth: null,
    beforeShowYear: null,
    calendarWeeks: false,
    clearBtn: false,
    dateDelimiter: ",",
    datesDisabled: [],
    daysOfWeekDisabled: [],
    daysOfWeekHighlighted: [],
    defaultViewDate: void 0,
    // placeholder, defaults to today() by the program
    disableTouchKeyboard: false,
    format: "mm/dd/yyyy",
    language: "en",
    maxDate: null,
    maxNumberOfDates: 1,
    maxView: 3,
    minDate: null,
    nextArrow: '<svg class="w-4 h-4 rtl:rotate-180 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/></svg>',
    orientation: "auto",
    pickLevel: 0,
    prevArrow: '<svg class="w-4 h-4 rtl:rotate-180 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5H1m0 0 4 4M1 5l4-4"/></svg>',
    showDaysOfWeek: true,
    showOnClick: true,
    showOnFocus: true,
    startView: 0,
    title: "",
    todayBtn: false,
    todayBtnMode: 0,
    todayHighlight: false,
    updateOnBlur: true,
    weekStart: 0
  };
  var range = document.createRange();
  function parseHTML(html) {
    return range.createContextualFragment(html);
  }
  function hideElement(el) {
    if (el.style.display === "none") {
      return;
    }
    if (el.style.display) {
      el.dataset.styleDisplay = el.style.display;
    }
    el.style.display = "none";
  }
  function showElement(el) {
    if (el.style.display !== "none") {
      return;
    }
    if (el.dataset.styleDisplay) {
      el.style.display = el.dataset.styleDisplay;
      delete el.dataset.styleDisplay;
    } else {
      el.style.display = "";
    }
  }
  function emptyChildNodes(el) {
    if (el.firstChild) {
      el.removeChild(el.firstChild);
      emptyChildNodes(el);
    }
  }
  function replaceChildNodes(el, newChildNodes) {
    emptyChildNodes(el);
    if (newChildNodes instanceof DocumentFragment) {
      el.appendChild(newChildNodes);
    } else if (typeof newChildNodes === "string") {
      el.appendChild(parseHTML(newChildNodes));
    } else if (typeof newChildNodes.forEach === "function") {
      newChildNodes.forEach(function(node) {
        el.appendChild(node);
      });
    }
  }
  var defaultLang = defaultOptions.language;
  var defaultFormat = defaultOptions.format;
  var defaultWeekStart = defaultOptions.weekStart;
  function sanitizeDOW(dow, day) {
    return dow.length < 6 && day >= 0 && day < 7 ? pushUnique(dow, day) : dow;
  }
  function calcEndOfWeek(startOfWeek) {
    return (startOfWeek + 6) % 7;
  }
  function validateDate(value, format2, locale, origValue) {
    var date = parseDate(value, format2, locale);
    return date !== void 0 ? date : origValue;
  }
  function validateViewId(value, origValue) {
    var max2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 3;
    var viewId = parseInt(value, 10);
    return viewId >= 0 && viewId <= max2 ? viewId : origValue;
  }
  function processOptions(options, datepicker) {
    var inOpts = Object.assign({}, options);
    var config = {};
    var locales2 = datepicker.constructor.locales;
    var _ref = datepicker.config || {}, format2 = _ref.format, language = _ref.language, locale = _ref.locale, maxDate = _ref.maxDate, maxView = _ref.maxView, minDate = _ref.minDate, pickLevel = _ref.pickLevel, startView = _ref.startView, weekStart = _ref.weekStart;
    if (inOpts.language) {
      var lang;
      if (inOpts.language !== language) {
        if (locales2[inOpts.language]) {
          lang = inOpts.language;
        } else {
          lang = inOpts.language.split("-")[0];
          if (locales2[lang] === void 0) {
            lang = false;
          }
        }
      }
      delete inOpts.language;
      if (lang) {
        language = config.language = lang;
        var origLocale = locale || locales2[defaultLang];
        locale = Object.assign({
          format: defaultFormat,
          weekStart: defaultWeekStart
        }, locales2[defaultLang]);
        if (language !== defaultLang) {
          Object.assign(locale, locales2[language]);
        }
        config.locale = locale;
        if (format2 === origLocale.format) {
          format2 = config.format = locale.format;
        }
        if (weekStart === origLocale.weekStart) {
          weekStart = config.weekStart = locale.weekStart;
          config.weekEnd = calcEndOfWeek(locale.weekStart);
        }
      }
    }
    if (inOpts.format) {
      var hasToDisplay = typeof inOpts.format.toDisplay === "function";
      var hasToValue = typeof inOpts.format.toValue === "function";
      var validFormatString = reFormatTokens.test(inOpts.format);
      if (hasToDisplay && hasToValue || validFormatString) {
        format2 = config.format = inOpts.format;
      }
      delete inOpts.format;
    }
    var minDt = minDate;
    var maxDt = maxDate;
    if (inOpts.minDate !== void 0) {
      minDt = inOpts.minDate === null ? dateValue(0, 0, 1) : validateDate(inOpts.minDate, format2, locale, minDt);
      delete inOpts.minDate;
    }
    if (inOpts.maxDate !== void 0) {
      maxDt = inOpts.maxDate === null ? void 0 : validateDate(inOpts.maxDate, format2, locale, maxDt);
      delete inOpts.maxDate;
    }
    if (maxDt < minDt) {
      minDate = config.minDate = maxDt;
      maxDate = config.maxDate = minDt;
    } else {
      if (minDate !== minDt) {
        minDate = config.minDate = minDt;
      }
      if (maxDate !== maxDt) {
        maxDate = config.maxDate = maxDt;
      }
    }
    if (inOpts.datesDisabled) {
      config.datesDisabled = inOpts.datesDisabled.reduce(function(dates, dt) {
        var date = parseDate(dt, format2, locale);
        return date !== void 0 ? pushUnique(dates, date) : dates;
      }, []);
      delete inOpts.datesDisabled;
    }
    if (inOpts.defaultViewDate !== void 0) {
      var viewDate = parseDate(inOpts.defaultViewDate, format2, locale);
      if (viewDate !== void 0) {
        config.defaultViewDate = viewDate;
      }
      delete inOpts.defaultViewDate;
    }
    if (inOpts.weekStart !== void 0) {
      var wkStart = Number(inOpts.weekStart) % 7;
      if (!isNaN(wkStart)) {
        weekStart = config.weekStart = wkStart;
        config.weekEnd = calcEndOfWeek(wkStart);
      }
      delete inOpts.weekStart;
    }
    if (inOpts.daysOfWeekDisabled) {
      config.daysOfWeekDisabled = inOpts.daysOfWeekDisabled.reduce(sanitizeDOW, []);
      delete inOpts.daysOfWeekDisabled;
    }
    if (inOpts.daysOfWeekHighlighted) {
      config.daysOfWeekHighlighted = inOpts.daysOfWeekHighlighted.reduce(sanitizeDOW, []);
      delete inOpts.daysOfWeekHighlighted;
    }
    if (inOpts.maxNumberOfDates !== void 0) {
      var maxNumberOfDates = parseInt(inOpts.maxNumberOfDates, 10);
      if (maxNumberOfDates >= 0) {
        config.maxNumberOfDates = maxNumberOfDates;
        config.multidate = maxNumberOfDates !== 1;
      }
      delete inOpts.maxNumberOfDates;
    }
    if (inOpts.dateDelimiter) {
      config.dateDelimiter = String(inOpts.dateDelimiter);
      delete inOpts.dateDelimiter;
    }
    var newPickLevel = pickLevel;
    if (inOpts.pickLevel !== void 0) {
      newPickLevel = validateViewId(inOpts.pickLevel, 2);
      delete inOpts.pickLevel;
    }
    if (newPickLevel !== pickLevel) {
      pickLevel = config.pickLevel = newPickLevel;
    }
    var newMaxView = maxView;
    if (inOpts.maxView !== void 0) {
      newMaxView = validateViewId(inOpts.maxView, maxView);
      delete inOpts.maxView;
    }
    newMaxView = pickLevel > newMaxView ? pickLevel : newMaxView;
    if (newMaxView !== maxView) {
      maxView = config.maxView = newMaxView;
    }
    var newStartView = startView;
    if (inOpts.startView !== void 0) {
      newStartView = validateViewId(inOpts.startView, newStartView);
      delete inOpts.startView;
    }
    if (newStartView < pickLevel) {
      newStartView = pickLevel;
    } else if (newStartView > maxView) {
      newStartView = maxView;
    }
    if (newStartView !== startView) {
      config.startView = newStartView;
    }
    if (inOpts.prevArrow) {
      var prevArrow = parseHTML(inOpts.prevArrow);
      if (prevArrow.childNodes.length > 0) {
        config.prevArrow = prevArrow.childNodes;
      }
      delete inOpts.prevArrow;
    }
    if (inOpts.nextArrow) {
      var nextArrow = parseHTML(inOpts.nextArrow);
      if (nextArrow.childNodes.length > 0) {
        config.nextArrow = nextArrow.childNodes;
      }
      delete inOpts.nextArrow;
    }
    if (inOpts.disableTouchKeyboard !== void 0) {
      config.disableTouchKeyboard = "ontouchstart" in document && !!inOpts.disableTouchKeyboard;
      delete inOpts.disableTouchKeyboard;
    }
    if (inOpts.orientation) {
      var orientation = inOpts.orientation.toLowerCase().split(/\s+/g);
      config.orientation = {
        x: orientation.find(function(x) {
          return x === "left" || x === "right";
        }) || "auto",
        y: orientation.find(function(y3) {
          return y3 === "top" || y3 === "bottom";
        }) || "auto"
      };
      delete inOpts.orientation;
    }
    if (inOpts.todayBtnMode !== void 0) {
      switch (inOpts.todayBtnMode) {
        case 0:
        case 1:
          config.todayBtnMode = inOpts.todayBtnMode;
      }
      delete inOpts.todayBtnMode;
    }
    Object.keys(inOpts).forEach(function(key) {
      if (inOpts[key] !== void 0 && hasProperty(defaultOptions, key)) {
        config[key] = inOpts[key];
      }
    });
    return config;
  }
  var pickerTemplate = optimizeTemplateHTML('<div class="datepicker hidden">\n  <div class="datepicker-picker inline-block rounded-lg bg-white dark:bg-gray-700 shadow-lg p-4">\n    <div class="datepicker-header">\n      <div class="datepicker-title bg-white dark:bg-gray-700 dark:text-white px-2 py-3 text-center font-semibold"></div>\n      <div class="datepicker-controls flex justify-between mb-2">\n        <button type="button" class="bg-white dark:bg-gray-700 rounded-lg text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white text-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200 prev-btn"></button>\n        <button type="button" class="text-sm rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 font-semibold py-2.5 px-5 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 view-switch"></button>\n        <button type="button" class="bg-white dark:bg-gray-700 rounded-lg text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white text-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200 next-btn"></button>\n      </div>\n    </div>\n    <div class="datepicker-main p-1"></div>\n    <div class="datepicker-footer">\n      <div class="datepicker-controls flex space-x-2 rtl:space-x-reverse mt-2">\n        <button type="button" class="%buttonClass% today-btn text-white bg-blue-700 !bg-primary-700 dark:bg-blue-600 dark:!bg-primary-600 hover:bg-blue-800 hover:!bg-primary-800 dark:hover:bg-blue-700 dark:hover:!bg-primary-700 focus:ring-4 focus:ring-blue-300 focus:!ring-primary-300 font-medium rounded-lg text-sm px-5 py-2 text-center w-1/2"></button>\n        <button type="button" class="%buttonClass% clear-btn text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-blue-300 focus:!ring-primary-300 font-medium rounded-lg text-sm px-5 py-2 text-center w-1/2"></button>\n      </div>\n    </div>\n  </div>\n</div>');
  var daysTemplate = optimizeTemplateHTML('<div class="days">\n  <div class="days-of-week grid grid-cols-7 mb-1">'.concat(createTagRepeat("span", 7, {
    "class": "dow block flex-1 leading-9 border-0 rounded-lg cursor-default text-center text-gray-900 font-semibold text-sm"
  }), '</div>\n  <div class="datepicker-grid w-64 grid grid-cols-7">').concat(createTagRepeat("span", 42, {
    "class": "block flex-1 leading-9 border-0 rounded-lg cursor-default text-center text-gray-900 font-semibold text-sm h-6 leading-6 text-sm font-medium text-gray-500 dark:text-gray-400"
  }), "</div>\n</div>"));
  var calendarWeeksTemplate = optimizeTemplateHTML('<div class="calendar-weeks">\n  <div class="days-of-week flex"><span class="dow h-6 leading-6 text-sm font-medium text-gray-500 dark:text-gray-400"></span></div>\n  <div class="weeks">'.concat(createTagRepeat("span", 6, {
    "class": "week block flex-1 leading-9 border-0 rounded-lg cursor-default text-center text-gray-900 font-semibold text-sm"
  }), "</div>\n</div>"));
  var View = /* @__PURE__ */ function() {
    function View2(picker, config) {
      _classCallCheck(this, View2);
      Object.assign(this, config, {
        picker,
        element: parseHTML('<div class="datepicker-view flex"></div>').firstChild,
        selected: []
      });
      this.init(this.picker.datepicker.config);
    }
    return _createClass(View2, [{
      key: "init",
      value: function init(options) {
        if (options.pickLevel !== void 0) {
          this.isMinView = this.id === options.pickLevel;
        }
        this.setOptions(options);
        this.updateFocus();
        this.updateSelection();
      }
      // Execute beforeShow() callback and apply the result to the element
      // args:
      // - current - current value on the iteration on view rendering
      // - timeValue - time value of the date to pass to beforeShow()
    }, {
      key: "performBeforeHook",
      value: function performBeforeHook(el, current, timeValue) {
        var result = this.beforeShow(new Date(timeValue));
        switch (_typeof(result)) {
          case "boolean":
            result = {
              enabled: result
            };
            break;
          case "string":
            result = {
              classes: result
            };
        }
        if (result) {
          if (result.enabled === false) {
            el.classList.add("disabled");
            pushUnique(this.disabled, current);
          }
          if (result.classes) {
            var _el$classList;
            var extraClasses = result.classes.split(/\s+/);
            (_el$classList = el.classList).add.apply(_el$classList, _toConsumableArray(extraClasses));
            if (extraClasses.includes("disabled")) {
              pushUnique(this.disabled, current);
            }
          }
          if (result.content) {
            replaceChildNodes(el, result.content);
          }
        }
      }
    }]);
  }();
  var DaysView = /* @__PURE__ */ function(_View) {
    function DaysView2(picker) {
      _classCallCheck(this, DaysView2);
      return _callSuper(this, DaysView2, [picker, {
        id: 0,
        name: "days",
        cellClass: "day"
      }]);
    }
    _inherits(DaysView2, _View);
    return _createClass(DaysView2, [{
      key: "init",
      value: function init(options) {
        var onConstruction = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        if (onConstruction) {
          var inner = parseHTML(daysTemplate).firstChild;
          this.dow = inner.firstChild;
          this.grid = inner.lastChild;
          this.element.appendChild(inner);
        }
        _get(_getPrototypeOf(DaysView2.prototype), "init", this).call(this, options);
      }
    }, {
      key: "setOptions",
      value: function setOptions(options) {
        var _this = this;
        var updateDOW;
        if (hasProperty(options, "minDate")) {
          this.minDate = options.minDate;
        }
        if (hasProperty(options, "maxDate")) {
          this.maxDate = options.maxDate;
        }
        if (options.datesDisabled) {
          this.datesDisabled = options.datesDisabled;
        }
        if (options.daysOfWeekDisabled) {
          this.daysOfWeekDisabled = options.daysOfWeekDisabled;
          updateDOW = true;
        }
        if (options.daysOfWeekHighlighted) {
          this.daysOfWeekHighlighted = options.daysOfWeekHighlighted;
        }
        if (options.todayHighlight !== void 0) {
          this.todayHighlight = options.todayHighlight;
        }
        if (options.weekStart !== void 0) {
          this.weekStart = options.weekStart;
          this.weekEnd = options.weekEnd;
          updateDOW = true;
        }
        if (options.locale) {
          var locale = this.locale = options.locale;
          this.dayNames = locale.daysMin;
          this.switchLabelFormat = locale.titleFormat;
          updateDOW = true;
        }
        if (options.beforeShowDay !== void 0) {
          this.beforeShow = typeof options.beforeShowDay === "function" ? options.beforeShowDay : void 0;
        }
        if (options.calendarWeeks !== void 0) {
          if (options.calendarWeeks && !this.calendarWeeks) {
            var weeksElem = parseHTML(calendarWeeksTemplate).firstChild;
            this.calendarWeeks = {
              element: weeksElem,
              dow: weeksElem.firstChild,
              weeks: weeksElem.lastChild
            };
            this.element.insertBefore(weeksElem, this.element.firstChild);
          } else if (this.calendarWeeks && !options.calendarWeeks) {
            this.element.removeChild(this.calendarWeeks.element);
            this.calendarWeeks = null;
          }
        }
        if (options.showDaysOfWeek !== void 0) {
          if (options.showDaysOfWeek) {
            showElement(this.dow);
            if (this.calendarWeeks) {
              showElement(this.calendarWeeks.dow);
            }
          } else {
            hideElement(this.dow);
            if (this.calendarWeeks) {
              hideElement(this.calendarWeeks.dow);
            }
          }
        }
        if (updateDOW) {
          Array.from(this.dow.children).forEach(function(el, index) {
            var dow = (_this.weekStart + index) % 7;
            el.textContent = _this.dayNames[dow];
            el.className = _this.daysOfWeekDisabled.includes(dow) ? "dow disabled text-center h-6 leading-6 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-not-allowed" : "dow text-center h-6 leading-6 text-sm font-medium text-gray-500 dark:text-gray-400";
          });
        }
      }
      // Apply update on the focused date to view's settings
    }, {
      key: "updateFocus",
      value: function updateFocus() {
        var viewDate = new Date(this.picker.viewDate);
        var viewYear = viewDate.getFullYear();
        var viewMonth = viewDate.getMonth();
        var firstOfMonth = dateValue(viewYear, viewMonth, 1);
        var start3 = dayOfTheWeekOf(firstOfMonth, this.weekStart, this.weekStart);
        this.first = firstOfMonth;
        this.last = dateValue(viewYear, viewMonth + 1, 0);
        this.start = start3;
        this.focused = this.picker.viewDate;
      }
      // Apply update on the selected dates to view's settings
    }, {
      key: "updateSelection",
      value: function updateSelection() {
        var _this$picker$datepick = this.picker.datepicker, dates = _this$picker$datepick.dates, rangepicker = _this$picker$datepick.rangepicker;
        this.selected = dates;
        if (rangepicker) {
          this.range = rangepicker.dates;
        }
      }
      // Update the entire view UI
    }, {
      key: "render",
      value: function render() {
        var _this2 = this;
        this.today = this.todayHighlight ? today() : void 0;
        this.disabled = _toConsumableArray(this.datesDisabled);
        var switchLabel = formatDate(this.focused, this.switchLabelFormat, this.locale);
        this.picker.setViewSwitchLabel(switchLabel);
        this.picker.setPrevBtnDisabled(this.first <= this.minDate);
        this.picker.setNextBtnDisabled(this.last >= this.maxDate);
        if (this.calendarWeeks) {
          var startOfWeek = dayOfTheWeekOf(this.first, 1, 1);
          Array.from(this.calendarWeeks.weeks.children).forEach(function(el, index) {
            el.textContent = getWeek(addWeeks(startOfWeek, index));
          });
        }
        Array.from(this.grid.children).forEach(function(el, index) {
          var classList = el.classList;
          var current = addDays(_this2.start, index);
          var date = new Date(current);
          var day = date.getDay();
          el.className = "datepicker-cell hover:bg-gray-100 dark:hover:bg-gray-600 block flex-1 leading-9 border-0 rounded-lg cursor-pointer text-center text-gray-900 dark:text-white font-semibold text-sm ".concat(_this2.cellClass);
          el.dataset.date = current;
          el.textContent = date.getDate();
          if (current < _this2.first) {
            classList.add("prev", "text-gray-500", "dark:text-white");
          } else if (current > _this2.last) {
            classList.add("next", "text-gray-500", "dark:text-white");
          }
          if (_this2.today === current) {
            classList.add("today", "bg-gray-100", "dark:bg-gray-600");
          }
          if (current < _this2.minDate || current > _this2.maxDate || _this2.disabled.includes(current)) {
            classList.add("disabled", "cursor-not-allowed", "text-gray-400", "dark:text-gray-500");
            classList.remove("hover:bg-gray-100", "dark:hover:bg-gray-600", "text-gray-900", "dark:text-white", "cursor-pointer");
          }
          if (_this2.daysOfWeekDisabled.includes(day)) {
            classList.add("disabled", "cursor-not-allowed", "text-gray-400", "dark:text-gray-500");
            classList.remove("hover:bg-gray-100", "dark:hover:bg-gray-600", "text-gray-900", "dark:text-white", "cursor-pointer");
            pushUnique(_this2.disabled, current);
          }
          if (_this2.daysOfWeekHighlighted.includes(day)) {
            classList.add("highlighted");
          }
          if (_this2.range) {
            var _this2$range = _slicedToArray(_this2.range, 2), rangeStart = _this2$range[0], rangeEnd = _this2$range[1];
            if (current > rangeStart && current < rangeEnd) {
              classList.add("range", "bg-gray-200", "dark:bg-gray-600");
              classList.remove("rounded-lg", "rounded-l-lg", "rounded-r-lg");
            }
            if (current === rangeStart) {
              classList.add("range-start", "bg-gray-100", "dark:bg-gray-600", "rounded-l-lg");
              classList.remove("rounded-lg", "rounded-r-lg");
            }
            if (current === rangeEnd) {
              classList.add("range-end", "bg-gray-100", "dark:bg-gray-600", "rounded-r-lg");
              classList.remove("rounded-lg", "rounded-l-lg");
            }
          }
          if (_this2.selected.includes(current)) {
            classList.add("selected", "bg-blue-700", "!bg-primary-700", "text-white", "dark:bg-blue-600", "dark:!bg-primary-600", "dark:text-white");
            classList.remove("text-gray-900", "text-gray-500", "hover:bg-gray-100", "dark:text-white", "dark:hover:bg-gray-600", "dark:bg-gray-600", "bg-gray-100", "bg-gray-200");
          }
          if (current === _this2.focused) {
            classList.add("focused");
          }
          if (_this2.beforeShow) {
            _this2.performBeforeHook(el, current, current);
          }
        });
      }
      // Update the view UI by applying the changes of selected and focused items
    }, {
      key: "refresh",
      value: function refresh() {
        var _this3 = this;
        var _ref = this.range || [], _ref2 = _slicedToArray(_ref, 2), rangeStart = _ref2[0], rangeEnd = _ref2[1];
        this.grid.querySelectorAll(".range, .range-start, .range-end, .selected, .focused").forEach(function(el) {
          el.classList.remove("range", "range-start", "range-end", "selected", "bg-blue-700", "!bg-primary-700", "text-white", "dark:bg-blue-600", "dark:!bg-primary-600", "dark:text-white", "focused");
          el.classList.add("text-gray-900", "rounded-lg", "dark:text-white");
        });
        Array.from(this.grid.children).forEach(function(el) {
          var current = Number(el.dataset.date);
          var classList = el.classList;
          classList.remove("bg-gray-200", "dark:bg-gray-600", "rounded-l-lg", "rounded-r-lg");
          if (current > rangeStart && current < rangeEnd) {
            classList.add("range", "bg-gray-200", "dark:bg-gray-600");
            classList.remove("rounded-lg");
          }
          if (current === rangeStart) {
            classList.add("range-start", "bg-gray-200", "dark:bg-gray-600", "rounded-l-lg");
            classList.remove("rounded-lg");
          }
          if (current === rangeEnd) {
            classList.add("range-end", "bg-gray-200", "dark:bg-gray-600", "rounded-r-lg");
            classList.remove("rounded-lg");
          }
          if (_this3.selected.includes(current)) {
            classList.add("selected", "bg-blue-700", "!bg-primary-700", "text-white", "dark:bg-blue-600", "dark:!bg-primary-600", "dark:text-white");
            classList.remove("text-gray-900", "hover:bg-gray-100", "dark:text-white", "dark:hover:bg-gray-600", "bg-gray-100", "bg-gray-200", "dark:bg-gray-600");
          }
          if (current === _this3.focused) {
            classList.add("focused");
          }
        });
      }
      // Update the view UI by applying the change of focused item
    }, {
      key: "refreshFocus",
      value: function refreshFocus() {
        var index = Math.round((this.focused - this.start) / 864e5);
        this.grid.querySelectorAll(".focused").forEach(function(el) {
          el.classList.remove("focused");
        });
        this.grid.children[index].classList.add("focused");
      }
    }]);
  }(View);
  function computeMonthRange(range2, thisYear) {
    if (!range2 || !range2[0] || !range2[1]) {
      return;
    }
    var _range = _slicedToArray(range2, 2), _range$ = _slicedToArray(_range[0], 2), startY = _range$[0], startM = _range$[1], _range$2 = _slicedToArray(_range[1], 2), endY = _range$2[0], endM = _range$2[1];
    if (startY > thisYear || endY < thisYear) {
      return;
    }
    return [startY === thisYear ? startM : -1, endY === thisYear ? endM : 12];
  }
  var MonthsView = /* @__PURE__ */ function(_View) {
    function MonthsView2(picker) {
      _classCallCheck(this, MonthsView2);
      return _callSuper(this, MonthsView2, [picker, {
        id: 1,
        name: "months",
        cellClass: "month"
      }]);
    }
    _inherits(MonthsView2, _View);
    return _createClass(MonthsView2, [{
      key: "init",
      value: function init(options) {
        var onConstruction = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        if (onConstruction) {
          this.grid = this.element;
          this.element.classList.add("months", "datepicker-grid", "w-64", "grid", "grid-cols-4");
          this.grid.appendChild(parseHTML(createTagRepeat("span", 12, {
            "data-month": function dataMonth(ix) {
              return ix;
            }
          })));
        }
        _get(_getPrototypeOf(MonthsView2.prototype), "init", this).call(this, options);
      }
    }, {
      key: "setOptions",
      value: function setOptions(options) {
        if (options.locale) {
          this.monthNames = options.locale.monthsShort;
        }
        if (hasProperty(options, "minDate")) {
          if (options.minDate === void 0) {
            this.minYear = this.minMonth = this.minDate = void 0;
          } else {
            var minDateObj = new Date(options.minDate);
            this.minYear = minDateObj.getFullYear();
            this.minMonth = minDateObj.getMonth();
            this.minDate = minDateObj.setDate(1);
          }
        }
        if (hasProperty(options, "maxDate")) {
          if (options.maxDate === void 0) {
            this.maxYear = this.maxMonth = this.maxDate = void 0;
          } else {
            var maxDateObj = new Date(options.maxDate);
            this.maxYear = maxDateObj.getFullYear();
            this.maxMonth = maxDateObj.getMonth();
            this.maxDate = dateValue(this.maxYear, this.maxMonth + 1, 0);
          }
        }
        if (options.beforeShowMonth !== void 0) {
          this.beforeShow = typeof options.beforeShowMonth === "function" ? options.beforeShowMonth : void 0;
        }
      }
      // Update view's settings to reflect the viewDate set on the picker
    }, {
      key: "updateFocus",
      value: function updateFocus() {
        var viewDate = new Date(this.picker.viewDate);
        this.year = viewDate.getFullYear();
        this.focused = viewDate.getMonth();
      }
      // Update view's settings to reflect the selected dates
    }, {
      key: "updateSelection",
      value: function updateSelection() {
        var _this$picker$datepick = this.picker.datepicker, dates = _this$picker$datepick.dates, rangepicker = _this$picker$datepick.rangepicker;
        this.selected = dates.reduce(function(selected, timeValue) {
          var date = new Date(timeValue);
          var year = date.getFullYear();
          var month = date.getMonth();
          if (selected[year] === void 0) {
            selected[year] = [month];
          } else {
            pushUnique(selected[year], month);
          }
          return selected;
        }, {});
        if (rangepicker && rangepicker.dates) {
          this.range = rangepicker.dates.map(function(timeValue) {
            var date = new Date(timeValue);
            return isNaN(date) ? void 0 : [date.getFullYear(), date.getMonth()];
          });
        }
      }
      // Update the entire view UI
    }, {
      key: "render",
      value: function render() {
        var _this = this;
        this.disabled = [];
        this.picker.setViewSwitchLabel(this.year);
        this.picker.setPrevBtnDisabled(this.year <= this.minYear);
        this.picker.setNextBtnDisabled(this.year >= this.maxYear);
        var selected = this.selected[this.year] || [];
        var yrOutOfRange = this.year < this.minYear || this.year > this.maxYear;
        var isMinYear = this.year === this.minYear;
        var isMaxYear = this.year === this.maxYear;
        var range2 = computeMonthRange(this.range, this.year);
        Array.from(this.grid.children).forEach(function(el, index) {
          var classList = el.classList;
          var date = dateValue(_this.year, index, 1);
          el.className = "datepicker-cell hover:bg-gray-100 dark:hover:bg-gray-600 block flex-1 leading-9 border-0 rounded-lg cursor-pointer text-center text-gray-900 dark:text-white font-semibold text-sm ".concat(_this.cellClass);
          if (_this.isMinView) {
            el.dataset.date = date;
          }
          el.textContent = _this.monthNames[index];
          if (yrOutOfRange || isMinYear && index < _this.minMonth || isMaxYear && index > _this.maxMonth) {
            classList.add("disabled");
          }
          if (range2) {
            var _range2 = _slicedToArray(range2, 2), rangeStart = _range2[0], rangeEnd = _range2[1];
            if (index > rangeStart && index < rangeEnd) {
              classList.add("range");
            }
            if (index === rangeStart) {
              classList.add("range-start");
            }
            if (index === rangeEnd) {
              classList.add("range-end");
            }
          }
          if (selected.includes(index)) {
            classList.add("selected", "bg-blue-700", "!bg-primary-700", "text-white", "dark:bg-blue-600", "dark:!bg-primary-600", "dark:text-white");
            classList.remove("text-gray-900", "hover:bg-gray-100", "dark:text-white", "dark:hover:bg-gray-600");
          }
          if (index === _this.focused) {
            classList.add("focused");
          }
          if (_this.beforeShow) {
            _this.performBeforeHook(el, index, date);
          }
        });
      }
      // Update the view UI by applying the changes of selected and focused items
    }, {
      key: "refresh",
      value: function refresh() {
        var _this2 = this;
        var selected = this.selected[this.year] || [];
        var _ref = computeMonthRange(this.range, this.year) || [], _ref2 = _slicedToArray(_ref, 2), rangeStart = _ref2[0], rangeEnd = _ref2[1];
        this.grid.querySelectorAll(".range, .range-start, .range-end, .selected, .focused").forEach(function(el) {
          el.classList.remove("range", "range-start", "range-end", "selected", "bg-blue-700", "!bg-primary-700", "dark:bg-blue-600", "dark:!bg-primary-700", "dark:text-white", "text-white", "focused");
          el.classList.add("text-gray-900", "hover:bg-gray-100", "dark:text-white", "dark:hover:bg-gray-600");
        });
        Array.from(this.grid.children).forEach(function(el, index) {
          var classList = el.classList;
          if (index > rangeStart && index < rangeEnd) {
            classList.add("range");
          }
          if (index === rangeStart) {
            classList.add("range-start");
          }
          if (index === rangeEnd) {
            classList.add("range-end");
          }
          if (selected.includes(index)) {
            classList.add("selected", "bg-blue-700", "!bg-primary-700", "text-white", "dark:bg-blue-600", "dark:!bg-primary-600", "dark:text-white");
            classList.remove("text-gray-900", "hover:bg-gray-100", "dark:text-white", "dark:hover:bg-gray-600");
          }
          if (index === _this2.focused) {
            classList.add("focused");
          }
        });
      }
      // Update the view UI by applying the change of focused item
    }, {
      key: "refreshFocus",
      value: function refreshFocus() {
        this.grid.querySelectorAll(".focused").forEach(function(el) {
          el.classList.remove("focused");
        });
        this.grid.children[this.focused].classList.add("focused");
      }
    }]);
  }(View);
  function toTitleCase(word) {
    return _toConsumableArray(word).reduce(function(str, ch, ix) {
      return str += ix ? ch : ch.toUpperCase();
    }, "");
  }
  var YearsView = /* @__PURE__ */ function(_View) {
    function YearsView2(picker, config) {
      _classCallCheck(this, YearsView2);
      return _callSuper(this, YearsView2, [picker, config]);
    }
    _inherits(YearsView2, _View);
    return _createClass(YearsView2, [{
      key: "init",
      value: function init(options) {
        var onConstruction = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        if (onConstruction) {
          this.navStep = this.step * 10;
          this.beforeShowOption = "beforeShow".concat(toTitleCase(this.cellClass));
          this.grid = this.element;
          this.element.classList.add(this.name, "datepicker-grid", "w-64", "grid", "grid-cols-4");
          this.grid.appendChild(parseHTML(createTagRepeat("span", 12)));
        }
        _get(_getPrototypeOf(YearsView2.prototype), "init", this).call(this, options);
      }
    }, {
      key: "setOptions",
      value: function setOptions(options) {
        if (hasProperty(options, "minDate")) {
          if (options.minDate === void 0) {
            this.minYear = this.minDate = void 0;
          } else {
            this.minYear = startOfYearPeriod(options.minDate, this.step);
            this.minDate = dateValue(this.minYear, 0, 1);
          }
        }
        if (hasProperty(options, "maxDate")) {
          if (options.maxDate === void 0) {
            this.maxYear = this.maxDate = void 0;
          } else {
            this.maxYear = startOfYearPeriod(options.maxDate, this.step);
            this.maxDate = dateValue(this.maxYear, 11, 31);
          }
        }
        if (options[this.beforeShowOption] !== void 0) {
          var beforeShow = options[this.beforeShowOption];
          this.beforeShow = typeof beforeShow === "function" ? beforeShow : void 0;
        }
      }
      // Update view's settings to reflect the viewDate set on the picker
    }, {
      key: "updateFocus",
      value: function updateFocus() {
        var viewDate = new Date(this.picker.viewDate);
        var first = startOfYearPeriod(viewDate, this.navStep);
        var last = first + 9 * this.step;
        this.first = first;
        this.last = last;
        this.start = first - this.step;
        this.focused = startOfYearPeriod(viewDate, this.step);
      }
      // Update view's settings to reflect the selected dates
    }, {
      key: "updateSelection",
      value: function updateSelection() {
        var _this = this;
        var _this$picker$datepick = this.picker.datepicker, dates = _this$picker$datepick.dates, rangepicker = _this$picker$datepick.rangepicker;
        this.selected = dates.reduce(function(years, timeValue) {
          return pushUnique(years, startOfYearPeriod(timeValue, _this.step));
        }, []);
        if (rangepicker && rangepicker.dates) {
          this.range = rangepicker.dates.map(function(timeValue) {
            if (timeValue !== void 0) {
              return startOfYearPeriod(timeValue, _this.step);
            }
          });
        }
      }
      // Update the entire view UI
    }, {
      key: "render",
      value: function render() {
        var _this2 = this;
        this.disabled = [];
        this.picker.setViewSwitchLabel("".concat(this.first, "-").concat(this.last));
        this.picker.setPrevBtnDisabled(this.first <= this.minYear);
        this.picker.setNextBtnDisabled(this.last >= this.maxYear);
        Array.from(this.grid.children).forEach(function(el, index) {
          var classList = el.classList;
          var current = _this2.start + index * _this2.step;
          var date = dateValue(current, 0, 1);
          el.className = "datepicker-cell hover:bg-gray-100 dark:hover:bg-gray-600 block flex-1 leading-9 border-0 rounded-lg cursor-pointer text-center text-gray-900 dark:text-white font-semibold text-sm ".concat(_this2.cellClass);
          if (_this2.isMinView) {
            el.dataset.date = date;
          }
          el.textContent = el.dataset.year = current;
          if (index === 0) {
            classList.add("prev");
          } else if (index === 11) {
            classList.add("next");
          }
          if (current < _this2.minYear || current > _this2.maxYear) {
            classList.add("disabled");
          }
          if (_this2.range) {
            var _this2$range = _slicedToArray(_this2.range, 2), rangeStart = _this2$range[0], rangeEnd = _this2$range[1];
            if (current > rangeStart && current < rangeEnd) {
              classList.add("range");
            }
            if (current === rangeStart) {
              classList.add("range-start");
            }
            if (current === rangeEnd) {
              classList.add("range-end");
            }
          }
          if (_this2.selected.includes(current)) {
            classList.add("selected", "bg-blue-700", "!bg-primary-700", "text-white", "dark:bg-blue-600", "dark:!bg-primary-600", "dark:text-white");
            classList.remove("text-gray-900", "hover:bg-gray-100", "dark:text-white", "dark:hover:bg-gray-600");
          }
          if (current === _this2.focused) {
            classList.add("focused");
          }
          if (_this2.beforeShow) {
            _this2.performBeforeHook(el, current, date);
          }
        });
      }
      // Update the view UI by applying the changes of selected and focused items
    }, {
      key: "refresh",
      value: function refresh() {
        var _this3 = this;
        var _ref = this.range || [], _ref2 = _slicedToArray(_ref, 2), rangeStart = _ref2[0], rangeEnd = _ref2[1];
        this.grid.querySelectorAll(".range, .range-start, .range-end, .selected, .focused").forEach(function(el) {
          el.classList.remove("range", "range-start", "range-end", "selected", "bg-blue-700", "!bg-primary-700", "text-white", "dark:bg-blue-600", "dark!bg-primary-600", "dark:text-white", "focused");
        });
        Array.from(this.grid.children).forEach(function(el) {
          var current = Number(el.textContent);
          var classList = el.classList;
          if (current > rangeStart && current < rangeEnd) {
            classList.add("range");
          }
          if (current === rangeStart) {
            classList.add("range-start");
          }
          if (current === rangeEnd) {
            classList.add("range-end");
          }
          if (_this3.selected.includes(current)) {
            classList.add("selected", "bg-blue-700", "!bg-primary-700", "text-white", "dark:bg-blue-600", "dark:!bg-primary-600", "dark:text-white");
            classList.remove("text-gray-900", "hover:bg-gray-100", "dark:text-white", "dark:hover:bg-gray-600");
          }
          if (current === _this3.focused) {
            classList.add("focused");
          }
        });
      }
      // Update the view UI by applying the change of focused item
    }, {
      key: "refreshFocus",
      value: function refreshFocus() {
        var index = Math.round((this.focused - this.start) / this.step);
        this.grid.querySelectorAll(".focused").forEach(function(el) {
          el.classList.remove("focused");
        });
        this.grid.children[index].classList.add("focused");
      }
    }]);
  }(View);
  function triggerDatepickerEvent(datepicker, type) {
    var detail = {
      date: datepicker.getDate(),
      viewDate: new Date(datepicker.picker.viewDate),
      viewId: datepicker.picker.currentView.id,
      datepicker
    };
    datepicker.element.dispatchEvent(new CustomEvent(type, {
      detail
    }));
  }
  function goToPrevOrNext(datepicker, direction) {
    var _datepicker$config = datepicker.config, minDate = _datepicker$config.minDate, maxDate = _datepicker$config.maxDate;
    var _datepicker$picker = datepicker.picker, currentView = _datepicker$picker.currentView, viewDate = _datepicker$picker.viewDate;
    var newViewDate;
    switch (currentView.id) {
      case 0:
        newViewDate = addMonths(viewDate, direction);
        break;
      case 1:
        newViewDate = addYears(viewDate, direction);
        break;
      default:
        newViewDate = addYears(viewDate, direction * currentView.navStep);
    }
    newViewDate = limitToRange(newViewDate, minDate, maxDate);
    datepicker.picker.changeFocus(newViewDate).render();
  }
  function switchView(datepicker) {
    var viewId = datepicker.picker.currentView.id;
    if (viewId === datepicker.config.maxView) {
      return;
    }
    datepicker.picker.changeView(viewId + 1).render();
  }
  function unfocus(datepicker) {
    if (datepicker.config.updateOnBlur) {
      datepicker.update({
        autohide: true
      });
    } else {
      datepicker.refresh("input");
      datepicker.hide();
    }
  }
  function goToSelectedMonthOrYear(datepicker, selection) {
    var picker = datepicker.picker;
    var viewDate = new Date(picker.viewDate);
    var viewId = picker.currentView.id;
    var newDate = viewId === 1 ? addMonths(viewDate, selection - viewDate.getMonth()) : addYears(viewDate, selection - viewDate.getFullYear());
    picker.changeFocus(newDate).changeView(viewId - 1).render();
  }
  function onClickTodayBtn(datepicker) {
    var picker = datepicker.picker;
    var currentDate = today();
    if (datepicker.config.todayBtnMode === 1) {
      if (datepicker.config.autohide) {
        datepicker.setDate(currentDate);
        return;
      }
      datepicker.setDate(currentDate, {
        render: false
      });
      picker.update();
    }
    if (picker.viewDate !== currentDate) {
      picker.changeFocus(currentDate);
    }
    picker.changeView(0).render();
  }
  function onClickClearBtn(datepicker) {
    datepicker.setDate({
      clear: true
    });
  }
  function onClickViewSwitch(datepicker) {
    switchView(datepicker);
  }
  function onClickPrevBtn(datepicker) {
    goToPrevOrNext(datepicker, -1);
  }
  function onClickNextBtn(datepicker) {
    goToPrevOrNext(datepicker, 1);
  }
  function onClickView(datepicker, ev) {
    var target = findElementInEventPath(ev, ".datepicker-cell");
    if (!target || target.classList.contains("disabled")) {
      return;
    }
    var _datepicker$picker$cu = datepicker.picker.currentView, id = _datepicker$picker$cu.id, isMinView = _datepicker$picker$cu.isMinView;
    if (isMinView) {
      datepicker.setDate(Number(target.dataset.date));
    } else if (id === 1) {
      goToSelectedMonthOrYear(datepicker, Number(target.dataset.month));
    } else {
      goToSelectedMonthOrYear(datepicker, Number(target.dataset.year));
    }
  }
  function onClickPicker(datepicker) {
    if (!datepicker.inline && !datepicker.config.disableTouchKeyboard) {
      datepicker.inputField.focus();
    }
  }
  function processPickerOptions(picker, options) {
    if (options.title !== void 0) {
      if (options.title) {
        picker.controls.title.textContent = options.title;
        showElement(picker.controls.title);
      } else {
        picker.controls.title.textContent = "";
        hideElement(picker.controls.title);
      }
    }
    if (options.prevArrow) {
      var prevBtn = picker.controls.prevBtn;
      emptyChildNodes(prevBtn);
      options.prevArrow.forEach(function(node) {
        prevBtn.appendChild(node.cloneNode(true));
      });
    }
    if (options.nextArrow) {
      var nextBtn = picker.controls.nextBtn;
      emptyChildNodes(nextBtn);
      options.nextArrow.forEach(function(node) {
        nextBtn.appendChild(node.cloneNode(true));
      });
    }
    if (options.locale) {
      picker.controls.todayBtn.textContent = options.locale.today;
      picker.controls.clearBtn.textContent = options.locale.clear;
    }
    if (options.todayBtn !== void 0) {
      if (options.todayBtn) {
        showElement(picker.controls.todayBtn);
      } else {
        hideElement(picker.controls.todayBtn);
      }
    }
    if (hasProperty(options, "minDate") || hasProperty(options, "maxDate")) {
      var _picker$datepicker$co = picker.datepicker.config, minDate = _picker$datepicker$co.minDate, maxDate = _picker$datepicker$co.maxDate;
      picker.controls.todayBtn.disabled = !isInRange(today(), minDate, maxDate);
    }
    if (options.clearBtn !== void 0) {
      if (options.clearBtn) {
        showElement(picker.controls.clearBtn);
      } else {
        hideElement(picker.controls.clearBtn);
      }
    }
  }
  function computeResetViewDate(datepicker) {
    var dates = datepicker.dates, config = datepicker.config;
    var viewDate = dates.length > 0 ? lastItemOf(dates) : config.defaultViewDate;
    return limitToRange(viewDate, config.minDate, config.maxDate);
  }
  function setViewDate(picker, newDate) {
    var oldViewDate = new Date(picker.viewDate);
    var newViewDate = new Date(newDate);
    var _picker$currentView = picker.currentView, id = _picker$currentView.id, year = _picker$currentView.year, first = _picker$currentView.first, last = _picker$currentView.last;
    var viewYear = newViewDate.getFullYear();
    picker.viewDate = newDate;
    if (viewYear !== oldViewDate.getFullYear()) {
      triggerDatepickerEvent(picker.datepicker, "changeYear");
    }
    if (newViewDate.getMonth() !== oldViewDate.getMonth()) {
      triggerDatepickerEvent(picker.datepicker, "changeMonth");
    }
    switch (id) {
      case 0:
        return newDate < first || newDate > last;
      case 1:
        return viewYear !== year;
      default:
        return viewYear < first || viewYear > last;
    }
  }
  function getTextDirection(el) {
    return window.getComputedStyle(el).direction;
  }
  var Picker = /* @__PURE__ */ function() {
    function Picker2(datepicker) {
      _classCallCheck(this, Picker2);
      this.datepicker = datepicker;
      var template = pickerTemplate.replace(/%buttonClass%/g, datepicker.config.buttonClass);
      var element = this.element = parseHTML(template).firstChild;
      var _element$firstChild$c = _slicedToArray(element.firstChild.children, 3), header = _element$firstChild$c[0], main2 = _element$firstChild$c[1], footer = _element$firstChild$c[2];
      var title = header.firstElementChild;
      var _header$lastElementCh = _slicedToArray(header.lastElementChild.children, 3), prevBtn = _header$lastElementCh[0], viewSwitch = _header$lastElementCh[1], nextBtn = _header$lastElementCh[2];
      var _footer$firstChild$ch = _slicedToArray(footer.firstChild.children, 2), todayBtn = _footer$firstChild$ch[0], clearBtn = _footer$firstChild$ch[1];
      var controls = {
        title,
        prevBtn,
        viewSwitch,
        nextBtn,
        todayBtn,
        clearBtn
      };
      this.main = main2;
      this.controls = controls;
      var elementClass = datepicker.inline ? "inline" : "dropdown";
      element.classList.add("datepicker-".concat(elementClass));
      elementClass === "dropdown" ? element.classList.add("dropdown", "absolute", "top-0", "left-0", "z-50", "pt-2") : null;
      processPickerOptions(this, datepicker.config);
      this.viewDate = computeResetViewDate(datepicker);
      registerListeners(datepicker, [[element, "click", onClickPicker.bind(null, datepicker), {
        capture: true
      }], [main2, "click", onClickView.bind(null, datepicker)], [controls.viewSwitch, "click", onClickViewSwitch.bind(null, datepicker)], [controls.prevBtn, "click", onClickPrevBtn.bind(null, datepicker)], [controls.nextBtn, "click", onClickNextBtn.bind(null, datepicker)], [controls.todayBtn, "click", onClickTodayBtn.bind(null, datepicker)], [controls.clearBtn, "click", onClickClearBtn.bind(null, datepicker)]]);
      this.views = [new DaysView(this), new MonthsView(this), new YearsView(this, {
        id: 2,
        name: "years",
        cellClass: "year",
        step: 1
      }), new YearsView(this, {
        id: 3,
        name: "decades",
        cellClass: "decade",
        step: 10
      })];
      this.currentView = this.views[datepicker.config.startView];
      this.currentView.render();
      this.main.appendChild(this.currentView.element);
      datepicker.config.container.appendChild(this.element);
    }
    return _createClass(Picker2, [{
      key: "setOptions",
      value: function setOptions(options) {
        processPickerOptions(this, options);
        this.views.forEach(function(view) {
          view.init(options, false);
        });
        this.currentView.render();
      }
    }, {
      key: "detach",
      value: function detach() {
        this.datepicker.config.container.removeChild(this.element);
      }
    }, {
      key: "show",
      value: function show() {
        if (this.active) {
          return;
        }
        this.element.classList.add("active", "block");
        this.element.classList.remove("hidden");
        this.active = true;
        var datepicker = this.datepicker;
        if (!datepicker.inline) {
          var inputDirection = getTextDirection(datepicker.inputField);
          if (inputDirection !== getTextDirection(datepicker.config.container)) {
            this.element.dir = inputDirection;
          } else if (this.element.dir) {
            this.element.removeAttribute("dir");
          }
          this.place();
          if (datepicker.config.disableTouchKeyboard) {
            datepicker.inputField.blur();
          }
        }
        triggerDatepickerEvent(datepicker, "show");
      }
    }, {
      key: "hide",
      value: function hide2() {
        if (!this.active) {
          return;
        }
        this.datepicker.exitEditMode();
        this.element.classList.remove("active", "block");
        this.element.classList.add("active", "block", "hidden");
        this.active = false;
        triggerDatepickerEvent(this.datepicker, "hide");
      }
    }, {
      key: "place",
      value: function place() {
        var _this$element = this.element, classList = _this$element.classList, style = _this$element.style;
        var _this$datepicker = this.datepicker, config = _this$datepicker.config, inputField = _this$datepicker.inputField;
        var container = config.container;
        var _this$element$getBoun = this.element.getBoundingClientRect(), calendarWidth = _this$element$getBoun.width, calendarHeight = _this$element$getBoun.height;
        var _container$getBoundin = container.getBoundingClientRect(), containerLeft = _container$getBoundin.left, containerTop = _container$getBoundin.top, containerWidth = _container$getBoundin.width;
        var _inputField$getBoundi = inputField.getBoundingClientRect(), inputLeft = _inputField$getBoundi.left, inputTop = _inputField$getBoundi.top, inputWidth = _inputField$getBoundi.width, inputHeight = _inputField$getBoundi.height;
        var _config$orientation = config.orientation, orientX = _config$orientation.x, orientY = _config$orientation.y;
        var scrollTop;
        var left2;
        var top2;
        if (container === document.body) {
          scrollTop = window.scrollY;
          left2 = inputLeft + window.scrollX;
          top2 = inputTop + scrollTop;
        } else {
          scrollTop = container.scrollTop;
          left2 = inputLeft - containerLeft;
          top2 = inputTop - containerTop + scrollTop;
        }
        if (orientX === "auto") {
          if (left2 < 0) {
            orientX = "left";
            left2 = 10;
          } else if (left2 + calendarWidth > containerWidth) {
            orientX = "right";
          } else {
            orientX = getTextDirection(inputField) === "rtl" ? "right" : "left";
          }
        }
        if (orientX === "right") {
          left2 -= calendarWidth - inputWidth;
        }
        if (orientY === "auto") {
          orientY = top2 - calendarHeight < scrollTop ? "bottom" : "top";
        }
        if (orientY === "top") {
          top2 -= calendarHeight;
        } else {
          top2 += inputHeight;
        }
        classList.remove("datepicker-orient-top", "datepicker-orient-bottom", "datepicker-orient-right", "datepicker-orient-left");
        classList.add("datepicker-orient-".concat(orientY), "datepicker-orient-".concat(orientX));
        style.top = top2 ? "".concat(top2, "px") : top2;
        style.left = left2 ? "".concat(left2, "px") : left2;
      }
    }, {
      key: "setViewSwitchLabel",
      value: function setViewSwitchLabel(labelText) {
        this.controls.viewSwitch.textContent = labelText;
      }
    }, {
      key: "setPrevBtnDisabled",
      value: function setPrevBtnDisabled(disabled) {
        this.controls.prevBtn.disabled = disabled;
      }
    }, {
      key: "setNextBtnDisabled",
      value: function setNextBtnDisabled(disabled) {
        this.controls.nextBtn.disabled = disabled;
      }
    }, {
      key: "changeView",
      value: function changeView(viewId) {
        var oldView = this.currentView;
        var newView = this.views[viewId];
        if (newView.id !== oldView.id) {
          this.currentView = newView;
          this._renderMethod = "render";
          triggerDatepickerEvent(this.datepicker, "changeView");
          this.main.replaceChild(newView.element, oldView.element);
        }
        return this;
      }
      // Change the focused date (view date)
    }, {
      key: "changeFocus",
      value: function changeFocus(newViewDate) {
        this._renderMethod = setViewDate(this, newViewDate) ? "render" : "refreshFocus";
        this.views.forEach(function(view) {
          view.updateFocus();
        });
        return this;
      }
      // Apply the change of the selected dates
    }, {
      key: "update",
      value: function update() {
        var newViewDate = computeResetViewDate(this.datepicker);
        this._renderMethod = setViewDate(this, newViewDate) ? "render" : "refresh";
        this.views.forEach(function(view) {
          view.updateFocus();
          view.updateSelection();
        });
        return this;
      }
      // Refresh the picker UI
    }, {
      key: "render",
      value: function render() {
        var quickRender = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
        var renderMethod = quickRender && this._renderMethod || "render";
        delete this._renderMethod;
        this.currentView[renderMethod]();
      }
    }]);
  }();
  function findNextAvailableOne(date, addFn, increase, testFn, min2, max2) {
    if (!isInRange(date, min2, max2)) {
      return;
    }
    if (testFn(date)) {
      var newDate = addFn(date, increase);
      return findNextAvailableOne(newDate, addFn, increase, testFn, min2, max2);
    }
    return date;
  }
  function moveByArrowKey(datepicker, ev, direction, vertical) {
    var picker = datepicker.picker;
    var currentView = picker.currentView;
    var step = currentView.step || 1;
    var viewDate = picker.viewDate;
    var addFn;
    var testFn;
    switch (currentView.id) {
      case 0:
        if (vertical) {
          viewDate = addDays(viewDate, direction * 7);
        } else if (ev.ctrlKey || ev.metaKey) {
          viewDate = addYears(viewDate, direction);
        } else {
          viewDate = addDays(viewDate, direction);
        }
        addFn = addDays;
        testFn = function testFn2(date) {
          return currentView.disabled.includes(date);
        };
        break;
      case 1:
        viewDate = addMonths(viewDate, vertical ? direction * 4 : direction);
        addFn = addMonths;
        testFn = function testFn2(date) {
          var dt = new Date(date);
          var year = currentView.year, disabled = currentView.disabled;
          return dt.getFullYear() === year && disabled.includes(dt.getMonth());
        };
        break;
      default:
        viewDate = addYears(viewDate, direction * (vertical ? 4 : 1) * step);
        addFn = addYears;
        testFn = function testFn2(date) {
          return currentView.disabled.includes(startOfYearPeriod(date, step));
        };
    }
    viewDate = findNextAvailableOne(viewDate, addFn, direction < 0 ? -step : step, testFn, currentView.minDate, currentView.maxDate);
    if (viewDate !== void 0) {
      picker.changeFocus(viewDate).render();
    }
  }
  function onKeydown(datepicker, ev) {
    if (ev.key === "Tab") {
      unfocus(datepicker);
      return;
    }
    var picker = datepicker.picker;
    var _picker$currentView = picker.currentView, id = _picker$currentView.id, isMinView = _picker$currentView.isMinView;
    if (!picker.active) {
      switch (ev.key) {
        case "ArrowDown":
        case "Escape":
          picker.show();
          break;
        case "Enter":
          datepicker.update();
          break;
        default:
          return;
      }
    } else if (datepicker.editMode) {
      switch (ev.key) {
        case "Escape":
          picker.hide();
          break;
        case "Enter":
          datepicker.exitEditMode({
            update: true,
            autohide: datepicker.config.autohide
          });
          break;
        default:
          return;
      }
    } else {
      switch (ev.key) {
        case "Escape":
          picker.hide();
          break;
        case "ArrowLeft":
          if (ev.ctrlKey || ev.metaKey) {
            goToPrevOrNext(datepicker, -1);
          } else if (ev.shiftKey) {
            datepicker.enterEditMode();
            return;
          } else {
            moveByArrowKey(datepicker, ev, -1, false);
          }
          break;
        case "ArrowRight":
          if (ev.ctrlKey || ev.metaKey) {
            goToPrevOrNext(datepicker, 1);
          } else if (ev.shiftKey) {
            datepicker.enterEditMode();
            return;
          } else {
            moveByArrowKey(datepicker, ev, 1, false);
          }
          break;
        case "ArrowUp":
          if (ev.ctrlKey || ev.metaKey) {
            switchView(datepicker);
          } else if (ev.shiftKey) {
            datepicker.enterEditMode();
            return;
          } else {
            moveByArrowKey(datepicker, ev, -1, true);
          }
          break;
        case "ArrowDown":
          if (ev.shiftKey && !ev.ctrlKey && !ev.metaKey) {
            datepicker.enterEditMode();
            return;
          }
          moveByArrowKey(datepicker, ev, 1, true);
          break;
        case "Enter":
          if (isMinView) {
            datepicker.setDate(picker.viewDate);
          } else {
            picker.changeView(id - 1).render();
          }
          break;
        case "Backspace":
        case "Delete":
          datepicker.enterEditMode();
          return;
        default:
          if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey) {
            datepicker.enterEditMode();
          }
          return;
      }
    }
    ev.preventDefault();
    ev.stopPropagation();
  }
  function onFocus(datepicker) {
    if (datepicker.config.showOnFocus && !datepicker._showing) {
      datepicker.show();
    }
  }
  function onMousedown(datepicker, ev) {
    var el = ev.target;
    if (datepicker.picker.active || datepicker.config.showOnClick) {
      el._active = el === document.activeElement;
      el._clicking = setTimeout(function() {
        delete el._active;
        delete el._clicking;
      }, 2e3);
    }
  }
  function onClickInput(datepicker, ev) {
    var el = ev.target;
    if (!el._clicking) {
      return;
    }
    clearTimeout(el._clicking);
    delete el._clicking;
    if (el._active) {
      datepicker.enterEditMode();
    }
    delete el._active;
    if (datepicker.config.showOnClick) {
      datepicker.show();
    }
  }
  function onPaste(datepicker, ev) {
    if (ev.clipboardData.types.includes("text/plain")) {
      datepicker.enterEditMode();
    }
  }
  function onClickOutside(datepicker, ev) {
    var element = datepicker.element;
    if (element !== document.activeElement) {
      return;
    }
    var pickerElem = datepicker.picker.element;
    if (findElementInEventPath(ev, function(el) {
      return el === element || el === pickerElem;
    })) {
      return;
    }
    unfocus(datepicker);
  }
  function stringifyDates(dates, config) {
    return dates.map(function(dt) {
      return formatDate(dt, config.format, config.locale);
    }).join(config.dateDelimiter);
  }
  function processInputDates(datepicker, inputDates) {
    var clear2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
    var config = datepicker.config, origDates = datepicker.dates, rangepicker = datepicker.rangepicker;
    if (inputDates.length === 0) {
      return clear2 ? [] : void 0;
    }
    var rangeEnd = rangepicker && datepicker === rangepicker.datepickers[1];
    var newDates = inputDates.reduce(function(dates, dt) {
      var date = parseDate(dt, config.format, config.locale);
      if (date === void 0) {
        return dates;
      }
      if (config.pickLevel > 0) {
        var _dt = new Date(date);
        if (config.pickLevel === 1) {
          date = rangeEnd ? _dt.setMonth(_dt.getMonth() + 1, 0) : _dt.setDate(1);
        } else {
          date = rangeEnd ? _dt.setFullYear(_dt.getFullYear() + 1, 0, 0) : _dt.setMonth(0, 1);
        }
      }
      if (isInRange(date, config.minDate, config.maxDate) && !dates.includes(date) && !config.datesDisabled.includes(date) && !config.daysOfWeekDisabled.includes(new Date(date).getDay())) {
        dates.push(date);
      }
      return dates;
    }, []);
    if (newDates.length === 0) {
      return;
    }
    if (config.multidate && !clear2) {
      newDates = newDates.reduce(function(dates, date) {
        if (!origDates.includes(date)) {
          dates.push(date);
        }
        return dates;
      }, origDates.filter(function(date) {
        return !newDates.includes(date);
      }));
    }
    return config.maxNumberOfDates && newDates.length > config.maxNumberOfDates ? newDates.slice(config.maxNumberOfDates * -1) : newDates;
  }
  function refreshUI(datepicker) {
    var mode = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 3;
    var quickRender = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    var config = datepicker.config, picker = datepicker.picker, inputField = datepicker.inputField;
    if (mode & 2) {
      var newView = picker.active ? config.pickLevel : config.startView;
      picker.update().changeView(newView).render(quickRender);
    }
    if (mode & 1 && inputField) {
      inputField.value = stringifyDates(datepicker.dates, config);
    }
  }
  function _setDate(datepicker, inputDates, options) {
    var clear2 = options.clear, render = options.render, autohide = options.autohide;
    if (render === void 0) {
      render = true;
    }
    if (!render) {
      autohide = false;
    } else if (autohide === void 0) {
      autohide = datepicker.config.autohide;
    }
    var newDates = processInputDates(datepicker, inputDates, clear2);
    if (!newDates) {
      return;
    }
    if (newDates.toString() !== datepicker.dates.toString()) {
      datepicker.dates = newDates;
      refreshUI(datepicker, render ? 3 : 1);
      triggerDatepickerEvent(datepicker, "changeDate");
    } else {
      refreshUI(datepicker, 1);
    }
    if (autohide) {
      datepicker.hide();
    }
  }
  var Datepicker = /* @__PURE__ */ function() {
    function Datepicker3(element) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      var rangepicker = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : void 0;
      _classCallCheck(this, Datepicker3);
      element.datepicker = this;
      this.element = element;
      var config = this.config = Object.assign({
        buttonClass: options.buttonClass && String(options.buttonClass) || "button",
        container: document.body,
        defaultViewDate: today(),
        maxDate: void 0,
        minDate: void 0
      }, processOptions(defaultOptions, this));
      this._options = options;
      Object.assign(config, processOptions(options, this));
      var inline = this.inline = element.tagName !== "INPUT";
      var inputField;
      var initialDates;
      if (inline) {
        config.container = element;
        initialDates = stringToArray(element.dataset.date, config.dateDelimiter);
        delete element.dataset.date;
      } else {
        var container = options.container ? document.querySelector(options.container) : null;
        if (container) {
          config.container = container;
        }
        inputField = this.inputField = element;
        inputField.classList.add("datepicker-input");
        initialDates = stringToArray(inputField.value, config.dateDelimiter);
      }
      if (rangepicker) {
        var index = rangepicker.inputs.indexOf(inputField);
        var datepickers = rangepicker.datepickers;
        if (index < 0 || index > 1 || !Array.isArray(datepickers)) {
          throw Error("Invalid rangepicker object.");
        }
        datepickers[index] = this;
        Object.defineProperty(this, "rangepicker", {
          get: function get3() {
            return rangepicker;
          }
        });
      }
      this.dates = [];
      var inputDateValues = processInputDates(this, initialDates);
      if (inputDateValues && inputDateValues.length > 0) {
        this.dates = inputDateValues;
      }
      if (inputField) {
        inputField.value = stringifyDates(this.dates, config);
      }
      var picker = this.picker = new Picker(this);
      if (inline) {
        this.show();
      } else {
        var onMousedownDocument = onClickOutside.bind(null, this);
        var listeners = [[inputField, "keydown", onKeydown.bind(null, this)], [inputField, "focus", onFocus.bind(null, this)], [inputField, "mousedown", onMousedown.bind(null, this)], [inputField, "click", onClickInput.bind(null, this)], [inputField, "paste", onPaste.bind(null, this)], [document, "mousedown", onMousedownDocument], [document, "touchstart", onMousedownDocument], [window, "resize", picker.place.bind(picker)]];
        registerListeners(this, listeners);
      }
    }
    return _createClass(Datepicker3, [{
      key: "active",
      get: (
        /**
         * @type {Boolean} - Whether the picker element is shown. `true` whne shown
         */
        function get3() {
          return !!(this.picker && this.picker.active);
        }
      )
      /**
       * @type {HTMLDivElement} - DOM object of picker element
       */
    }, {
      key: "pickerElement",
      get: function get3() {
        return this.picker ? this.picker.element : void 0;
      }
      /**
       * Set new values to the config options
       * @param {Object} options - config options to update
       */
    }, {
      key: "setOptions",
      value: function setOptions(options) {
        var picker = this.picker;
        var newOptions = processOptions(options, this);
        Object.assign(this._options, options);
        Object.assign(this.config, newOptions);
        picker.setOptions(newOptions);
        refreshUI(this, 3);
      }
      /**
       * Show the picker element
       */
    }, {
      key: "show",
      value: function show() {
        if (this.inputField) {
          if (this.inputField.disabled) {
            return;
          }
          if (this.inputField !== document.activeElement) {
            this._showing = true;
            this.inputField.focus();
            delete this._showing;
          }
        }
        this.picker.show();
      }
      /**
       * Hide the picker element
       * Not available on inline picker
       */
    }, {
      key: "hide",
      value: function hide2() {
        if (this.inline) {
          return;
        }
        this.picker.hide();
        this.picker.update().changeView(this.config.startView).render();
      }
      /**
       * Destroy the Datepicker instance
       * @return {Detepicker} - the instance destroyed
       */
    }, {
      key: "destroy",
      value: function destroy() {
        this.hide();
        unregisterListeners(this);
        this.picker.detach();
        if (!this.inline) {
          this.inputField.classList.remove("datepicker-input");
        }
        delete this.element.datepicker;
        return this;
      }
      /**
       * Get the selected date(s)
       *
       * The method returns a Date object of selected date by default, and returns
       * an array of selected dates in multidate mode. If format string is passed,
       * it returns date string(s) formatted in given format.
       *
       * @param  {String} [format] - Format string to stringify the date(s)
       * @return {Date|String|Date[]|String[]} - selected date(s), or if none is
       * selected, empty array in multidate mode and untitled in sigledate mode
       */
    }, {
      key: "getDate",
      value: function getDate() {
        var _this = this;
        var format2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
        var callback = format2 ? function(date) {
          return formatDate(date, format2, _this.config.locale);
        } : function(date) {
          return new Date(date);
        };
        if (this.config.multidate) {
          return this.dates.map(callback);
        }
        if (this.dates.length > 0) {
          return callback(this.dates[0]);
        }
      }
      /**
       * Set selected date(s)
       *
       * In multidate mode, you can pass multiple dates as a series of arguments
       * or an array. (Since each date is parsed individually, the type of the
       * dates doesn't have to be the same.)
       * The given dates are used to toggle the select status of each date. The
       * number of selected dates is kept from exceeding the length set to
       * maxNumberOfDates.
       *
       * With clear: true option, the method can be used to clear the selection
       * and to replace the selection instead of toggling in multidate mode.
       * If the option is passed with no date arguments or an empty dates array,
       * it works as "clear" (clear the selection then set nothing), and if the
       * option is passed with new dates to select, it works as "replace" (clear
       * the selection then set the given dates)
       *
       * When render: false option is used, the method omits re-rendering the
       * picker element. In this case, you need to call refresh() method later in
       * order for the picker element to reflect the changes. The input field is
       * refreshed always regardless of this option.
       *
       * When invalid (unparsable, repeated, disabled or out-of-range) dates are
       * passed, the method ignores them and applies only valid ones. In the case
       * that all the given dates are invalid, which is distinguished from passing
       * no dates, the method considers it as an error and leaves the selection
       * untouched.
       *
       * @param {...(Date|Number|String)|Array} [dates] - Date strings, Date
       * objects, time values or mix of those for new selection
       * @param {Object} [options] - function options
       * - clear: {boolean} - Whether to clear the existing selection
       *     defualt: false
       * - render: {boolean} - Whether to re-render the picker element
       *     default: true
       * - autohide: {boolean} - Whether to hide the picker element after re-render
       *     Ignored when used with render: false
       *     default: config.autohide
       */
    }, {
      key: "setDate",
      value: function setDate() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        var dates = [].concat(args);
        var opts = {};
        var lastArg = lastItemOf(args);
        if (_typeof(lastArg) === "object" && !Array.isArray(lastArg) && !(lastArg instanceof Date) && lastArg) {
          Object.assign(opts, dates.pop());
        }
        var inputDates = Array.isArray(dates[0]) ? dates[0] : dates;
        _setDate(this, inputDates, opts);
      }
      /**
       * Update the selected date(s) with input field's value
       * Not available on inline picker
       *
       * The input field will be refreshed with properly formatted date string.
       *
       * @param  {Object} [options] - function options
       * - autohide: {boolean} - whether to hide the picker element after refresh
       *     default: false
       */
    }, {
      key: "update",
      value: function update() {
        var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
        if (this.inline) {
          return;
        }
        var opts = {
          clear: true,
          autohide: !!(options && options.autohide)
        };
        var inputDates = stringToArray(this.inputField.value, this.config.dateDelimiter);
        _setDate(this, inputDates, opts);
      }
      /**
       * Refresh the picker element and the associated input field
       * @param {String} [target] - target item when refreshing one item only
       * 'picker' or 'input'
       * @param {Boolean} [forceRender] - whether to re-render the picker element
       * regardless of its state instead of optimized refresh
       */
    }, {
      key: "refresh",
      value: function refresh() {
        var target = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
        var forceRender = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        if (target && typeof target !== "string") {
          forceRender = target;
          target = void 0;
        }
        var mode;
        if (target === "picker") {
          mode = 2;
        } else if (target === "input") {
          mode = 1;
        } else {
          mode = 3;
        }
        refreshUI(this, mode, !forceRender);
      }
      /**
       * Enter edit mode
       * Not available on inline picker or when the picker element is hidden
       */
    }, {
      key: "enterEditMode",
      value: function enterEditMode() {
        if (this.inline || !this.picker.active || this.editMode) {
          return;
        }
        this.editMode = true;
        this.inputField.classList.add("in-edit", "border-blue-700", "!border-primary-700");
      }
      /**
       * Exit from edit mode
       * Not available on inline picker
       * @param  {Object} [options] - function options
       * - update: {boolean} - whether to call update() after exiting
       *     If false, input field is revert to the existing selection
       *     default: false
       */
    }, {
      key: "exitEditMode",
      value: function exitEditMode() {
        var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
        if (this.inline || !this.editMode) {
          return;
        }
        var opts = Object.assign({
          update: false
        }, options);
        delete this.editMode;
        this.inputField.classList.remove("in-edit", "border-blue-700", "!border-primary-700");
        if (opts.update) {
          this.update(opts);
        }
      }
    }], [{
      key: "formatDate",
      value: function formatDate$1(date, format2, lang) {
        return formatDate(date, format2, lang && locales[lang] || locales.en);
      }
      /**
       * Parse date string
       * @param  {String|Date|Number} dateStr - date string, Date object or time
       * value to parse
       * @param  {String|Object} format - format string or object that contains
       * toValue() custom parser, whose signature is
       * - args:
       *   - dateStr: {String|Date|Number} - the dateStr passed to the method
       *   - format: {Object} - the format object passed to the method
       *   - locale: {Object} - locale for the language specified by `lang`
       * - return:
       *     {Date|Number} parsed date or its time value
       * @param  {String} [lang=en] - language code for the locale to use
       * @return {Number} time value of parsed date
       */
    }, {
      key: "parseDate",
      value: function parseDate$1(dateStr, format2, lang) {
        return parseDate(dateStr, format2, lang && locales[lang] || locales.en);
      }
      /**
       * @type {Object} - Installed locales in `[languageCode]: localeObject` format
       * en`:_English (US)_ is pre-installed.
       */
    }, {
      key: "locales",
      get: function get3() {
        return locales;
      }
    }]);
  }();
  function filterOptions(options) {
    var newOpts = Object.assign({}, options);
    delete newOpts.inputs;
    delete newOpts.allowOneSidedRange;
    delete newOpts.maxNumberOfDates;
    return newOpts;
  }
  function setupDatepicker(rangepicker, changeDateListener, el, options) {
    registerListeners(rangepicker, [[el, "changeDate", changeDateListener]]);
    new Datepicker(el, options, rangepicker);
  }
  function onChangeDate(rangepicker, ev) {
    if (rangepicker._updating) {
      return;
    }
    rangepicker._updating = true;
    var target = ev.target;
    if (target.datepicker === void 0) {
      return;
    }
    var datepickers = rangepicker.datepickers;
    var setDateOptions = {
      render: false
    };
    var changedSide = rangepicker.inputs.indexOf(target);
    var otherSide = changedSide === 0 ? 1 : 0;
    var changedDate = datepickers[changedSide].dates[0];
    var otherDate = datepickers[otherSide].dates[0];
    if (changedDate !== void 0 && otherDate !== void 0) {
      if (changedSide === 0 && changedDate > otherDate) {
        datepickers[0].setDate(otherDate, setDateOptions);
        datepickers[1].setDate(changedDate, setDateOptions);
      } else if (changedSide === 1 && changedDate < otherDate) {
        datepickers[0].setDate(changedDate, setDateOptions);
        datepickers[1].setDate(otherDate, setDateOptions);
      }
    } else if (!rangepicker.allowOneSidedRange) {
      if (changedDate !== void 0 || otherDate !== void 0) {
        setDateOptions.clear = true;
        datepickers[otherSide].setDate(datepickers[changedSide].dates, setDateOptions);
      }
    }
    datepickers[0].picker.update().render();
    datepickers[1].picker.update().render();
    delete rangepicker._updating;
  }
  var DateRangePicker = /* @__PURE__ */ function() {
    function DateRangePicker2(element) {
      var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      _classCallCheck(this, DateRangePicker2);
      var inputs = Array.isArray(options.inputs) ? options.inputs : Array.from(element.querySelectorAll("input"));
      if (inputs.length < 2) {
        return;
      }
      element.rangepicker = this;
      this.element = element;
      this.inputs = inputs.slice(0, 2);
      this.allowOneSidedRange = !!options.allowOneSidedRange;
      var changeDateListener = onChangeDate.bind(null, this);
      var cleanOptions = filterOptions(options);
      var datepickers = [];
      Object.defineProperty(this, "datepickers", {
        get: function get3() {
          return datepickers;
        }
      });
      setupDatepicker(this, changeDateListener, this.inputs[0], cleanOptions);
      setupDatepicker(this, changeDateListener, this.inputs[1], cleanOptions);
      Object.freeze(datepickers);
      if (datepickers[0].dates.length > 0) {
        onChangeDate(this, {
          target: this.inputs[0]
        });
      } else if (datepickers[1].dates.length > 0) {
        onChangeDate(this, {
          target: this.inputs[1]
        });
      }
    }
    return _createClass(DateRangePicker2, [{
      key: "dates",
      get: function get3() {
        return this.datepickers.length === 2 ? [this.datepickers[0].dates[0], this.datepickers[1].dates[0]] : void 0;
      }
      /**
       * Set new values to the config options
       * @param {Object} options - config options to update
       */
    }, {
      key: "setOptions",
      value: function setOptions(options) {
        this.allowOneSidedRange = !!options.allowOneSidedRange;
        var cleanOptions = filterOptions(options);
        this.datepickers[0].setOptions(cleanOptions);
        this.datepickers[1].setOptions(cleanOptions);
      }
      /**
       * Destroy the DateRangePicker instance
       * @return {DateRangePicker} - the instance destroyed
       */
    }, {
      key: "destroy",
      value: function destroy() {
        this.datepickers[0].destroy();
        this.datepickers[1].destroy();
        unregisterListeners(this);
        delete this.element.rangepicker;
      }
      /**
       * Get the start and end dates of the date range
       *
       * The method returns Date objects by default. If format string is passed,
       * it returns date strings formatted in given format.
       * The result array always contains 2 items (start date/end date) and
       * undefined is used for unselected side. (e.g. If none is selected,
       * the result will be [undefined, undefined]. If only the end date is set
       * when allowOneSidedRange config option is true, [undefined, endDate] will
       * be returned.)
       *
       * @param  {String} [format] - Format string to stringify the dates
       * @return {Array} - Start and end dates
       */
    }, {
      key: "getDates",
      value: function getDates() {
        var _this = this;
        var format2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
        var callback = format2 ? function(date) {
          return formatDate(date, format2, _this.datepickers[0].config.locale);
        } : function(date) {
          return new Date(date);
        };
        return this.dates.map(function(date) {
          return date === void 0 ? date : callback(date);
        });
      }
      /**
       * Set the start and end dates of the date range
       *
       * The method calls datepicker.setDate() internally using each of the
       * arguments in start→end order.
       *
       * When a clear: true option object is passed instead of a date, the method
       * clears the date.
       *
       * If an invalid date, the same date as the current one or an option object
       * without clear: true is passed, the method considers that argument as an
       * "ineffective" argument because calling datepicker.setDate() with those
       * values makes no changes to the date selection.
       *
       * When the allowOneSidedRange config option is false, passing {clear: true}
       * to clear the range works only when it is done to the last effective
       * argument (in other words, passed to rangeEnd or to rangeStart along with
       * ineffective rangeEnd). This is because when the date range is changed,
       * it gets normalized based on the last change at the end of the changing
       * process.
       *
       * @param {Date|Number|String|Object} rangeStart - Start date of the range
       * or {clear: true} to clear the date
       * @param {Date|Number|String|Object} rangeEnd - End date of the range
       * or {clear: true} to clear the date
       */
    }, {
      key: "setDates",
      value: function setDates(rangeStart, rangeEnd) {
        var _this$datepickers = _slicedToArray(this.datepickers, 2), datepicker0 = _this$datepickers[0], datepicker1 = _this$datepickers[1];
        var origDates = this.dates;
        this._updating = true;
        datepicker0.setDate(rangeStart);
        datepicker1.setDate(rangeEnd);
        delete this._updating;
        if (datepicker1.dates[0] !== origDates[1]) {
          onChangeDate(this, {
            target: this.inputs[1]
          });
        } else if (datepicker0.dates[0] !== origDates[0]) {
          onChangeDate(this, {
            target: this.inputs[0]
          });
        }
      }
    }]);
  }();

  // node_modules/flowbite/lib/esm/components/datepicker/index.js
  var __assign14 = function() {
    __assign14 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign14.apply(this, arguments);
  };
  var Default14 = {
    defaultDatepickerId: null,
    autohide: false,
    format: "mm/dd/yyyy",
    maxDate: null,
    minDate: null,
    orientation: "bottom",
    buttons: false,
    autoSelectToday: 0,
    title: null,
    language: "en",
    rangePicker: false,
    onShow: function() {
    },
    onHide: function() {
    }
  };
  var DefaultInstanceOptions14 = {
    id: null,
    override: true
  };
  var Datepicker2 = (
    /** @class */
    function() {
      function Datepicker3(datepickerEl, options, instanceOptions) {
        if (datepickerEl === void 0) {
          datepickerEl = null;
        }
        if (options === void 0) {
          options = Default14;
        }
        if (instanceOptions === void 0) {
          instanceOptions = DefaultInstanceOptions14;
        }
        this._instanceId = instanceOptions.id ? instanceOptions.id : datepickerEl.id;
        this._datepickerEl = datepickerEl;
        this._datepickerInstance = null;
        this._options = __assign14(__assign14({}, Default14), options);
        this._initialized = false;
        this.init();
        instances_default.addInstance("Datepicker", this, this._instanceId, instanceOptions.override);
      }
      Datepicker3.prototype.init = function() {
        if (this._datepickerEl && !this._initialized) {
          if (this._options.rangePicker) {
            this._datepickerInstance = new DateRangePicker(this._datepickerEl, this._getDatepickerOptions(this._options));
          } else {
            this._datepickerInstance = new Datepicker(this._datepickerEl, this._getDatepickerOptions(this._options));
          }
          this._initialized = true;
        }
      };
      Datepicker3.prototype.destroy = function() {
        if (this._initialized) {
          this._initialized = false;
          this._datepickerInstance.destroy();
        }
      };
      Datepicker3.prototype.removeInstance = function() {
        this.destroy();
        instances_default.removeInstance("Datepicker", this._instanceId);
      };
      Datepicker3.prototype.destroyAndRemoveInstance = function() {
        this.destroy();
        this.removeInstance();
      };
      Datepicker3.prototype.getDatepickerInstance = function() {
        return this._datepickerInstance;
      };
      Datepicker3.prototype.getDate = function() {
        if (this._options.rangePicker && this._datepickerInstance instanceof DateRangePicker) {
          return this._datepickerInstance.getDates();
        }
        if (!this._options.rangePicker && this._datepickerInstance instanceof Datepicker) {
          return this._datepickerInstance.getDate();
        }
      };
      Datepicker3.prototype.setDate = function(date) {
        if (this._options.rangePicker && this._datepickerInstance instanceof DateRangePicker) {
          return this._datepickerInstance.setDates(date);
        }
        if (!this._options.rangePicker && this._datepickerInstance instanceof Datepicker) {
          return this._datepickerInstance.setDate(date);
        }
      };
      Datepicker3.prototype.show = function() {
        this._datepickerInstance.show();
        this._options.onShow(this);
      };
      Datepicker3.prototype.hide = function() {
        this._datepickerInstance.hide();
        this._options.onHide(this);
      };
      Datepicker3.prototype._getDatepickerOptions = function(options) {
        var datepickerOptions = {};
        if (options.buttons) {
          datepickerOptions.todayBtn = true;
          datepickerOptions.clearBtn = true;
          if (options.autoSelectToday) {
            datepickerOptions.todayBtnMode = 1;
          }
        }
        if (options.autohide) {
          datepickerOptions.autohide = true;
        }
        if (options.format) {
          datepickerOptions.format = options.format;
        }
        if (options.maxDate) {
          datepickerOptions.maxDate = options.maxDate;
        }
        if (options.minDate) {
          datepickerOptions.minDate = options.minDate;
        }
        if (options.orientation) {
          datepickerOptions.orientation = options.orientation;
        }
        if (options.title) {
          datepickerOptions.title = options.title;
        }
        if (options.language) {
          datepickerOptions.language = options.language;
        }
        return datepickerOptions;
      };
      Datepicker3.prototype.updateOnShow = function(callback) {
        this._options.onShow = callback;
      };
      Datepicker3.prototype.updateOnHide = function(callback) {
        this._options.onHide = callback;
      };
      return Datepicker3;
    }()
  );
  function initDatepickers() {
    document.querySelectorAll("[datepicker], [inline-datepicker], [date-rangepicker]").forEach(function($datepickerEl) {
      if ($datepickerEl) {
        var buttons = $datepickerEl.hasAttribute("datepicker-buttons");
        var autoselectToday = $datepickerEl.hasAttribute("datepicker-autoselect-today");
        var autohide = $datepickerEl.hasAttribute("datepicker-autohide");
        var format2 = $datepickerEl.getAttribute("datepicker-format");
        var maxDate = $datepickerEl.getAttribute("datepicker-max-date");
        var minDate = $datepickerEl.getAttribute("datepicker-min-date");
        var orientation_1 = $datepickerEl.getAttribute("datepicker-orientation");
        var title = $datepickerEl.getAttribute("datepicker-title");
        var language = $datepickerEl.getAttribute("datepicker-language");
        var rangePicker = $datepickerEl.hasAttribute("date-rangepicker");
        new Datepicker2($datepickerEl, {
          buttons: buttons ? buttons : Default14.buttons,
          autoSelectToday: autoselectToday ? autoselectToday : Default14.autoSelectToday,
          autohide: autohide ? autohide : Default14.autohide,
          format: format2 ? format2 : Default14.format,
          maxDate: maxDate ? maxDate : Default14.maxDate,
          minDate: minDate ? minDate : Default14.minDate,
          orientation: orientation_1 ? orientation_1 : Default14.orientation,
          title: title ? title : Default14.title,
          language: language ? language : Default14.language,
          rangePicker: rangePicker ? rangePicker : Default14.rangePicker
        });
      } else {
        console.error("The datepicker element does not exist. Please check the datepicker attribute.");
      }
    });
  }
  if (typeof window !== "undefined") {
    window.Datepicker = Datepicker2;
    window.initDatepickers = initDatepickers;
  }

  // node_modules/flowbite/lib/esm/components/index.js
  function initFlowbite() {
    initAccordions();
    initCollapses();
    initCarousels();
    initDismisses();
    initDropdowns();
    initModals();
    initDrawers();
    initTabs();
    initTooltips();
    initPopovers();
    initDials();
    initInputCounters();
    initCopyClipboards();
    initDatepickers();
  }
  if (typeof window !== "undefined") {
    window.initFlowbite = initFlowbite;
  }

  // node_modules/flowbite/lib/esm/index.js
  var events = new events_default("load", [
    initAccordions,
    initCollapses,
    initCarousels,
    initDismisses,
    initDropdowns,
    initModals,
    initDrawers,
    initTabs,
    initTooltips,
    initPopovers,
    initDials,
    initInputCounters,
    initCopyClipboards,
    initDatepickers
  ]);
  events.init();
})();
