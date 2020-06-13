(function (l, i, v, e) {
  v = l.createElement(i);
  v.async = 1;
  v.src =
    "//" +
    (location.host || "localhost").split(":")[0] +
    ":35729/livereload.js?snipver=1";
  e = l.getElementsByTagName(i)[0];
  e.parentNode.insertBefore(v, e);
})(document, "script");
var app = (function () {
  "use strict";

  function noop() {}
  function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
      loc: { file, line, column, char },
    };
  }
  function run(fn) {
    return fn();
  }
  function blank_object() {
    return Object.create(null);
  }
  function run_all(fns) {
    fns.forEach(run);
  }
  function is_function(thing) {
    return typeof thing === "function";
  }
  function safe_not_equal(a, b) {
    return a != a
      ? b == b
      : a !== b || (a && typeof a === "object") || typeof a === "function";
  }

  function append(target, node) {
    target.appendChild(node);
  }
  function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
  }
  function detach(node) {
    node.parentNode.removeChild(node);
  }
  function element(name) {
    return document.createElement(name);
  }
  function text(data) {
    return document.createTextNode(data);
  }
  function space() {
    return text(" ");
  }
  function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
  }
  function attr(node, attribute, value) {
    if (value == null) node.removeAttribute(attribute);
    else node.setAttribute(attribute, value);
  }
  function to_number(value) {
    return value === "" ? undefined : +value;
  }
  function children(element) {
    return Array.from(element.childNodes);
  }
  function set_data(text, data) {
    data = "" + data;
    if (text.data !== data) text.data = data;
  }
  function toggle_class(element, name, toggle) {
    element.classList[toggle ? "add" : "remove"](name);
  }

  let current_component;
  function set_current_component(component) {
    current_component = component;
  }

  const dirty_components = [];
  const resolved_promise = Promise.resolve();
  let update_scheduled = false;
  const binding_callbacks = [];
  const render_callbacks = [];
  const flush_callbacks = [];
  function schedule_update() {
    if (!update_scheduled) {
      update_scheduled = true;
      resolved_promise.then(flush);
    }
  }
  function add_binding_callback(fn) {
    binding_callbacks.push(fn);
  }
  function add_render_callback(fn) {
    render_callbacks.push(fn);
  }
  function flush() {
    const seen_callbacks = new Set();
    do {
      // first, call beforeUpdate functions
      // and update components
      while (dirty_components.length) {
        const component = dirty_components.shift();
        set_current_component(component);
        update(component.$$);
      }
      while (binding_callbacks.length) binding_callbacks.shift()();
      // then, once components are updated, call
      // afterUpdate functions. This may cause
      // subsequent updates...
      while (render_callbacks.length) {
        const callback = render_callbacks.pop();
        if (!seen_callbacks.has(callback)) {
          callback();
          // ...so guard against infinite loops
          seen_callbacks.add(callback);
        }
      }
    } while (dirty_components.length);
    while (flush_callbacks.length) {
      flush_callbacks.pop()();
    }
    update_scheduled = false;
  }
  function update($$) {
    if ($$.fragment) {
      $$.update($$.dirty);
      run_all($$.before_render);
      $$.fragment.p($$.dirty, $$.ctx);
      $$.dirty = null;
      $$.after_render.forEach(add_render_callback);
    }
  }
  function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_render } = component.$$;
    fragment.m(target, anchor);
    // onMount happens after the initial afterUpdate. Because
    // afterUpdate callbacks happen in reverse order (inner first)
    // we schedule onMount callbacks before afterUpdate callbacks
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        // Edge case - component was destroyed immediately,
        // most likely as a result of a binding initialising
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
    after_render.forEach(add_render_callback);
  }
  function destroy(component, detaching) {
    if (component.$$) {
      run_all(component.$$.on_destroy);
      component.$$.fragment.d(detaching);
      // TODO null out other refs, including component.$$ (but need to
      // preserve final state?)
      component.$$.on_destroy = component.$$.fragment = null;
      component.$$.ctx = {};
    }
  }
  function make_dirty(component, key) {
    if (!component.$$.dirty) {
      dirty_components.push(component);
      schedule_update();
      component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
  }
  function init(
    component,
    options,
    instance,
    create_fragment,
    not_equal$$1,
    prop_names
  ) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = (component.$$ = {
      fragment: null,
      ctx: null,
      // state
      props: prop_names,
      update: noop,
      not_equal: not_equal$$1,
      bound: blank_object(),
      // lifecycle
      on_mount: [],
      on_destroy: [],
      before_render: [],
      after_render: [],
      context: new Map(parent_component ? parent_component.$$.context : []),
      // everything else
      callbacks: blank_object(),
      dirty: null,
    });
    let ready = false;
    $$.ctx = instance
      ? instance(component, props, (key, value) => {
          if ($$.ctx && not_equal$$1($$.ctx[key], ($$.ctx[key] = value))) {
            if ($$.bound[key]) $$.bound[key](value);
            if (ready) make_dirty(component, key);
          }
        })
      : props;
    $$.update();
    ready = true;
    run_all($$.before_render);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
      if (options.hydrate) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        $$.fragment.l(children(options.target));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        $$.fragment.c();
      }
      if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
      mount_component(component, options.target, options.anchor);
      flush();
    }
    set_current_component(parent_component);
  }
  class SvelteComponent {
    $destroy() {
      destroy(this, true);
      this.$destroy = noop;
    }
    $on(type, callback) {
      const callbacks =
        this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
      callbacks.push(callback);
      return () => {
        const index = callbacks.indexOf(callback);
        if (index !== -1) callbacks.splice(index, 1);
      };
    }
    $set() {
      // overridden by instance, if it has props
    }
  }
  class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
      if (!options || (!options.target && !options.$$inline)) {
        throw new Error(`'target' is a required option`);
      }
      super();
    }
    $destroy() {
      super.$destroy();
      this.$destroy = () => {
        console.warn(`Component was already destroyed`); // eslint-disable-line no-console
      };
    }
  }

  /* src/index.html generated by Svelte v3.5.1 */

  const file = "src/index.html";

  // (107:4) {:else}
  function create_else_block(ctx) {
    var div11,
      img,
      t0,
      h1,
      t2,
      label0,
      t4,
      div0,
      t5_value = ctx.wastedHoursProject.toLocaleString(
        "en",
        ctx.decimalOptions
      ),
      t5,
      t6,
      label1,
      t8,
      div1,
      t9_value = ctx.opportunityCost.toLocaleString("en", ctx.currencyOptions),
      t9,
      t10,
      label2,
      t12,
      div2,
      t13_value = ctx.billableHoursYearly.toLocaleString(
        "en",
        ctx.integerOptions
      ),
      t13,
      t14,
      label3,
      t16,
      div9,
      div5,
      div3,
      t17_value = ctx.revenueIncreaseTeam.toLocaleString(
        "en",
        ctx.currencyOptions
      ),
      t17,
      t18,
      div4,
      t19,
      t20,
      t21,
      t22,
      div8,
      div6,
      t23_value = ctx.revenueIncreaseOrg.toLocaleString(
        "en",
        ctx.currencyOptions
      ),
      t23,
      t24,
      div7,
      t25,
      t26,
      t27,
      t28,
      div10,
      p0,
      t30,
      p1,
      span,
      t32,
      a,
      t33,
      dispose;

    return {
      c: function create() {
        div11 = element("div");
        img = element("img");
        t0 = space();
        h1 = element("h1");
        h1.textContent = "Kalata is awesome";
        t2 = space();
        label0 = element("label");
        label0.textContent = "Hours per week saved per employee:";
        t4 = space();
        div0 = element("div");
        t5 = text(t5_value);
        t6 = space();
        label1 = element("label");
        label1.textContent = "Team opportunity cost per week:";
        t8 = space();
        div1 = element("div");
        t9 = text(t9_value);
        t10 = space();
        label2 = element("label");
        label2.textContent = "Hours saved yearly per employee:";
        t12 = space();
        div2 = element("div");
        t13 = text(t13_value);
        t14 = space();
        label3 = element("label");
        label3.textContent = "Potential NET savings with Roger yearly";
        t16 = space();
        div9 = element("div");
        div5 = element("div");
        div3 = element("div");
        t17 = text(t17_value);
        t18 = space();
        div4 = element("div");
        t19 = text("with Roger Plus at ");
        t20 = text(currency);
        t21 = text("49/mo");
        t22 = space();
        div8 = element("div");
        div6 = element("div");
        t23 = text(t23_value);
        t24 = space();
        div7 = element("div");
        t25 = text("with Roger Pro at ");
        t26 = text(currency);
        t27 = text("119/mo");
        t28 = space();
        div10 = element("div");
        p0 = element("p");
        p0.textContent = "Share results";
        t30 = space();
        p1 = element("p");
        span = element("span");
        span.textContent = "✅";
        t32 = space();
        a = element("a");
        t33 = text("copy this link");
        img.src = "roger-logo.svg";
        img.alt = "Roger's logo";
        add_location(img, file, 108, 8, 4652);
        h1.className = "svelte-1qztvta";
        add_location(h1, file, 109, 8, 4706);
        label0.className = "svelte-1qztvta";
        add_location(label0, file, 110, 8, 4741);
        div0.className = "roi-result svelte-1qztvta";
        add_location(div0, file, 111, 8, 4799);
        label1.className = "svelte-1qztvta";
        add_location(label1, file, 112, 8, 4895);
        div1.className = "roi-result svelte-1qztvta";
        add_location(div1, file, 113, 8, 4950);
        label2.className = "svelte-1qztvta";
        add_location(label2, file, 114, 8, 5044);
        div2.className = "roi-result svelte-1qztvta";
        add_location(div2, file, 115, 8, 5100);
        label3.className = "svelte-1qztvta";
        add_location(label3, file, 116, 8, 5197);
        div3.className = "roi-result svelte-1qztvta";
        add_location(div3, file, 119, 16, 5351);
        div4.className = "roi-hint svelte-1qztvta";
        add_location(div4, file, 120, 16, 5457);
        div5.className = "double-result__block svelte-1qztvta";
        add_location(div5, file, 118, 12, 5300);
        div6.className = "roi-result svelte-1qztvta";
        add_location(div6, file, 123, 16, 5602);
        div7.className = "roi-hint svelte-1qztvta";
        add_location(div7, file, 124, 16, 5707);
        div8.className = "double-result__block svelte-1qztvta";
        add_location(div8, file, 122, 12, 5551);
        div9.className = "double-result svelte-1qztvta";
        add_location(div9, file, 117, 8, 5260);
        add_location(p0, file, 128, 16, 5856);
        span.className = "roi-copy-feedback svelte-1qztvta";
        toggle_class(span, "roi-copy-feedback-visible", ctx.linkCopyFeedback);
        add_location(span, file, 129, 19, 5896);
        a.className = "roi-link svelte-1qztvta";
        a.href = ctx.shareableLink;
        add_location(a, file, 129, 111, 5988);
        add_location(p1, file, 129, 16, 5893);
        div10.className = "roi-share svelte-1qztvta";
        add_location(div10, file, 127, 12, 5816);
        div11.className = "roi-block sticky svelte-1qztvta";
        add_location(div11, file, 107, 4, 4613);
        dispose = listen(a, "click", ctx.copyLink);
      },

      m: function mount(target, anchor) {
        insert(target, div11, anchor);
        append(div11, img);
        append(div11, t0);
        append(div11, h1);
        append(div11, t2);
        append(div11, label0);
        append(div11, t4);
        append(div11, div0);
        append(div0, t5);
        append(div11, t6);
        append(div11, label1);
        append(div11, t8);
        append(div11, div1);
        append(div1, t9);
        append(div11, t10);
        append(div11, label2);
        append(div11, t12);
        append(div11, div2);
        append(div2, t13);
        append(div11, t14);
        append(div11, label3);
        append(div11, t16);
        append(div11, div9);
        append(div9, div5);
        append(div5, div3);
        append(div3, t17);
        append(div5, t18);
        append(div5, div4);
        append(div4, t19);
        append(div4, t20);
        append(div4, t21);
        append(div9, t22);
        append(div9, div8);
        append(div8, div6);
        append(div6, t23);
        append(div8, t24);
        append(div8, div7);
        append(div7, t25);
        append(div7, t26);
        append(div7, t27);
        append(div11, t28);
        append(div11, div10);
        append(div10, p0);
        append(div10, t30);
        append(div10, p1);
        append(p1, span);
        append(p1, t32);
        append(p1, a);
        append(a, t33);
      },

      p: function update(changed, ctx) {
        if (
          changed.wastedHoursProject &&
          t5_value !==
            (t5_value = ctx.wastedHoursProject.toLocaleString(
              "en",
              ctx.decimalOptions
            ))
        ) {
          set_data(t5, t5_value);
        }

        if (
          changed.opportunityCost &&
          t9_value !==
            (t9_value = ctx.opportunityCost.toLocaleString(
              "en",
              ctx.currencyOptions
            ))
        ) {
          set_data(t9, t9_value);
        }

        if (
          changed.billableHoursYearly &&
          t13_value !==
            (t13_value = ctx.billableHoursYearly.toLocaleString(
              "en",
              ctx.integerOptions
            ))
        ) {
          set_data(t13, t13_value);
        }

        if (
          changed.revenueIncreaseTeam &&
          t17_value !==
            (t17_value = ctx.revenueIncreaseTeam.toLocaleString(
              "en",
              ctx.currencyOptions
            ))
        ) {
          set_data(t17, t17_value);
        }

        if (
          changed.revenueIncreaseOrg &&
          t23_value !==
            (t23_value = ctx.revenueIncreaseOrg.toLocaleString(
              "en",
              ctx.currencyOptions
            ))
        ) {
          set_data(t23, t23_value);
        }

        if (changed.linkCopyFeedback) {
          toggle_class(span, "roi-copy-feedback-visible", ctx.linkCopyFeedback);
        }

        if (changed.shareableLink) {
          a.href = ctx.shareableLink;
        }
      },

      d: function destroy(detaching) {
        if (detaching) {
          detach(div11);
        }

        dispose();
      },
    };
  }

  // (99:4) {#if showExplanation}
  function create_if_block(ctx) {
    var div1, h1, t1, div0, t3, button, dispose;

    return {
      c: function create() {
        div1 = element("div");
        h1 = element("h1");
        h1.textContent = "How does it work";
        t1 = space();
        div0 = element("div");
        div0.textContent =
          "Fill in the fields about your team and processes. We've entered default values to help you get started.";
        t3 = space();
        button = element("button");
        button.textContent = "Calculate";
        h1.className = "svelte-1qztvta";
        add_location(h1, file, 100, 8, 4367);
        div0.className = "svelte-1qztvta";
        add_location(div0, file, 101, 8, 4401);
        button.className = "svelte-1qztvta";
        add_location(button, file, 104, 8, 4542);
        div1.className = "roi-block sticky roi-how svelte-1qztvta";
        add_location(div1, file, 99, 4, 4320);
        dispose = listen(button, "click", ctx.start);
      },

      m: function mount(target, anchor) {
        insert(target, div1, anchor);
        append(div1, h1);
        append(div1, t1);
        append(div1, div0);
        append(div1, t3);
        append(div1, button);
      },

      p: noop,

      d: function destroy(detaching) {
        if (detaching) {
          detach(div1);
        }

        dispose();
      },
    };
  }

  function create_fragment(ctx) {
    var div5,
      div4,
      img,
      t0,
      h1,
      t2,
      div2,
      h20,
      t4,
      label0,
      t6,
      input0,
      input0_placeholder_value,
      t7,
      label1,
      t9,
      div1,
      input1,
      input1_placeholder_value,
      t10,
      div0,
      t11,
      t12,
      div3,
      h21,
      t14,
      label2,
      t16,
      input2,
      input2_placeholder_value,
      t17,
      label3,
      t19,
      input3,
      input3_placeholder_value,
      t20,
      label4,
      t22,
      input4,
      input4_placeholder_value,
      t23,
      dispose;

    function select_block_type(ctx) {
      if (ctx.showExplanation) return create_if_block;
      return create_else_block;
    }

    var current_block_type = select_block_type(ctx);
    var if_block = current_block_type(ctx);

    return {
      c: function create() {
        div5 = element("div");
        div4 = element("div");
        img = element("img");
        t0 = space();
        h1 = element("h1");
        h1.textContent = "ROI with Roger";
        t2 = space();
        div2 = element("div");
        h20 = element("h2");
        h20.textContent = "Your accounting team";
        t4 = space();
        label0 = element("label");
        label0.textContent = "Team members";
        t6 = space();
        input0 = element("input");
        t7 = space();
        label1 = element("label");
        label1.textContent = "Avg. annual cost of a team member";
        t9 = space();
        div1 = element("div");
        input1 = element("input");
        t10 = space();
        div0 = element("div");
        t11 = text(currency);
        t12 = space();
        div3 = element("div");
        h21 = element("h2");
        h21.textContent = "Weekly time spent in manual work (hours/member)";
        t14 = space();
        label2 = element("label");
        label2.textContent = "Expense approval & management";
        t16 = space();
        input2 = element("input");
        t17 = space();
        label3 = element("label");
        label3.textContent = "Uploading bills";
        t19 = space();
        input3 = element("input");
        t20 = space();
        label4 = element("label");
        label4.textContent = "Paying vendors";
        t22 = space();
        input4 = element("input");
        t23 = space();
        if_block.c();
        img.src = "roger-logo.jpg";
        img.alt = "Roger's logo";
        add_location(img, file, 76, 8, 3136);
        h1.className = "svelte-1qztvta";
        add_location(h1, file, 77, 8, 3190);
        h20.className = "svelte-1qztvta";
        add_location(h20, file, 79, 12, 3258);
        label0.className = "svelte-1qztvta";
        add_location(label0, file, 80, 12, 3300);
        input0.placeholder = input0_placeholder_value = ctx.initial.team;
        attr(input0, "type", "number");
        input0.min = "0";
        input0.className = "svelte-1qztvta";
        add_location(input0, file, 81, 12, 3340);
        label1.className = "svelte-1qztvta";
        add_location(label1, file, 82, 12, 3454);
        input1.placeholder = input1_placeholder_value = ctx.initial.billable;
        attr(input1, "type", "number");
        input1.min = "0";
        input1.className = "svelte-1qztvta";
        add_location(input1, file, 84, 16, 3558);
        div0.className = "roi-sign svelte-1qztvta";
        add_location(div0, file, 85, 16, 3661);
        div1.className = "roi-currency svelte-1qztvta";
        add_location(div1, file, 83, 12, 3515);
        div2.className = "roi-group svelte-1qztvta";
        add_location(div2, file, 78, 8, 3222);
        h21.className = "svelte-1qztvta";
        add_location(h21, file, 89, 12, 3778);
        label2.className = "svelte-1qztvta";
        add_location(label2, file, 90, 12, 3847);
        input2.placeholder = input2_placeholder_value = ctx.initial.expense;
        attr(input2, "type", "number");
        input2.min = "0";
        input2.className = "svelte-1qztvta";
        add_location(input2, file, 91, 12, 3904);
        label3.className = "svelte-1qztvta";
        add_location(label3, file, 92, 12, 4001);
        input3.placeholder = input3_placeholder_value = ctx.initial.bills;
        attr(input3, "type", "number");
        input3.min = "0";
        input3.className = "svelte-1qztvta";
        add_location(input3, file, 93, 12, 4044);
        label4.className = "svelte-1qztvta";
        add_location(label4, file, 94, 12, 4137);
        input4.placeholder = input4_placeholder_value = ctx.initial.vendors;
        attr(input4, "type", "number");
        input4.min = "0";
        input4.className = "svelte-1qztvta";
        add_location(input4, file, 95, 12, 4179);
        div3.className = "roi-group svelte-1qztvta";
        add_location(div3, file, 88, 8, 3742);
        div4.className = "roi-block svelte-1qztvta";
        add_location(div4, file, 75, 4, 3063);
        div5.className = "roi-wrapper svelte-1qztvta";
        add_location(div5, file, 74, 0, 3033);

        dispose = [
          listen(input0, "input", ctx.input0_input_handler),
          listen(input1, "input", ctx.input1_input_handler),
          listen(input2, "input", ctx.input2_input_handler),
          listen(input3, "input", ctx.input3_input_handler),
          listen(input4, "input", ctx.input4_input_handler),
          listen(div4, "change", ctx.change_handler),
        ];
      },

      l: function claim(nodes) {
        throw new Error(
          "options.hydrate only works if the component was compiled with the `hydratable: true` option"
        );
      },

      m: function mount(target, anchor) {
        insert(target, div5, anchor);
        append(div5, div4);
        append(div4, img);
        append(div4, t0);
        append(div4, h1);
        append(div4, t2);
        append(div4, div2);
        append(div2, h20);
        append(div2, t4);
        append(div2, label0);
        append(div2, t6);
        append(div2, input0);

        input0.value = ctx.team;

        add_binding_callback(() => ctx.input0_binding(input0, null));
        append(div2, t7);
        append(div2, label1);
        append(div2, t9);
        append(div2, div1);
        append(div1, input1);

        input1.value = ctx.billable;

        append(div1, t10);
        append(div1, div0);
        append(div0, t11);
        append(div4, t12);
        append(div4, div3);
        append(div3, h21);
        append(div3, t14);
        append(div3, label2);
        append(div3, t16);
        append(div3, input2);

        input2.value = ctx.expense;

        append(div3, t17);
        append(div3, label3);
        append(div3, t19);
        append(div3, input3);

        input3.value = ctx.bills;

        append(div3, t20);
        append(div3, label4);
        append(div3, t22);
        append(div3, input4);

        input4.value = ctx.vendors;

        append(div5, t23);
        if_block.m(div5, null);
      },

      p: function update(changed, ctx) {
        if (changed.team) input0.value = ctx.team;
        if (changed.items) {
          ctx.input0_binding(null, input0);
          ctx.input0_binding(input0, null);
        }
        if (changed.billable) input1.value = ctx.billable;
        if (changed.expense) input2.value = ctx.expense;
        if (changed.bills) input3.value = ctx.bills;
        if (changed.vendors) input4.value = ctx.vendors;

        if (
          current_block_type ===
            (current_block_type = select_block_type(ctx)) &&
          if_block
        ) {
          if_block.p(changed, ctx);
        } else {
          if_block.d(1);
          if_block = current_block_type(ctx);
          if (if_block) {
            if_block.c();
            if_block.m(div5, null);
          }
        }
      },

      i: noop,
      o: noop,

      d: function destroy(detaching) {
        if (detaching) {
          detach(div5);
        }

        ctx.input0_binding(null, input0);
        if_block.d();
        run_all(dispose);
      },
    };
  }

  let currency = "$";

  let feedbackLoops = 1;

  function stripQueryString(href) {
    return href.split("?")[0];
  }

  function instance($$self, $$props, $$invalidate) {
    const qsInput = (
      new URLSearchParams(window.location.search).get("roi_brand") || ""
    ).split("-");
    const initial = {
      team: parseInt(qsInput[0]) || 2,
      billable: parseInt(qsInput[1]) || 60000,
      expense: parseInt(qsInput[2]) || 4,
      bills: parseFloat(qsInput[3]) || 1.5,
      vendors: parseFloat(qsInput[4]) || 1.5,
      communicationVendors: parseFloat(qsInput[5]) || 0.2,
    };

    const decimalOptions = { style: "decimal", maximumFractionDigits: 1 };
    const integerOptions = { style: "decimal", maximumFractionDigits: 0 };
    const currencyOptions = {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    };
    let showExplanation = qsInput.length < 2;
    let firstInput;
    let shareableLink;
    let linkCopyFeedback = false;

    let team = initial.team;
    let billable = initial.billable;
    let expense = initial.expense;
    let bills = initial.bills;
    let vendors = initial.vendors;
    let communicationVendors = initial.communicationVendors;

    function start() {
      $$invalidate("showExplanation", (showExplanation = false));
      firstInput.focus();
      firstInput.select();
    }

    function copyLink(event) {
      event.preventDefault();
      navigator.clipboard.writeText(`${shareableLink}`);
      $$invalidate("linkCopyFeedback", (linkCopyFeedback = true));
      setTimeout(() => {
        const $$result = (linkCopyFeedback = false);
        $$invalidate("linkCopyFeedback", linkCopyFeedback);
        return $$result;
      }, 1500);
      return false;
    }

    function input0_input_handler() {
      team = to_number(this.value);
      $$invalidate("team", team);
    }

    function input0_binding($$node, check) {
      firstInput = $$node;
      $$invalidate("firstInput", firstInput);
    }

    function input1_input_handler() {
      billable = to_number(this.value);
      $$invalidate("billable", billable);
    }

    function input2_input_handler() {
      expense = to_number(this.value);
      $$invalidate("expense", expense);
    }

    function input3_input_handler() {
      bills = to_number(this.value);
      $$invalidate("bills", bills);
    }

    function input4_input_handler() {
      vendors = to_number(this.value);
      $$invalidate("vendors", vendors);
    }

    function change_handler() {
      const $$result = (showExplanation = false);
      $$invalidate("showExplanation", showExplanation);
      return $$result;
    }

    let billsProject,
      timeSendingApprovalsProject,
      Communication,
      wastedHoursProject,
      opportunityCost,
      billableHoursYearly,
      revenueIncreaseTeam,
      revenueIncreaseOrg;

    $$self.$$.update = (
      $$dirty = {
        expense: 1,
        bills: 1,
        vendors: 1,
        feedbackLoops: 1,
        communicationVendors: 1,
        billsProject: 1,
        timeSendingApprovalsProject: 1,
        Communication: 1,
        wastedHoursProject: 1,
        billable: 1,
        team: 1,
        billableHoursYearly: 1,
      }
    ) => {
      if ($$dirty.expense || $$dirty.bills || $$dirty.vendors) {
        $$invalidate(
          "billsProject",
          (billsProject =
            (expense || initial.expense) +
            (bills || initial.bills) +
            (vendors || initial.vendors))
        );
      }
      if ($$dirty.vendors || $$dirty.feedbackLoops) {
        $$invalidate(
          "timeSendingApprovalsProject",
          (timeSendingApprovalsProject =
            (vendors || initial.vendors) * feedbackLoops)
        );
      }
      if ($$dirty.feedbackLoops || $$dirty.communicationVendors) {
        $$invalidate(
          "Communication",
          (Communication =
            (feedbackLoops *
              (communicationVendors || initial.communicationVendors) +
              feedbackLoops) /
            60)
        );
      }
      if (
        $$dirty.billsProject ||
        $$dirty.timeSendingApprovalsProject ||
        $$dirty.Communication
      ) {
        $$invalidate(
          "wastedHoursProject",
          (wastedHoursProject =
            billsProject + timeSendingApprovalsProject + Communication)
        );
      }
      if ($$dirty.wastedHoursProject || $$dirty.billable || $$dirty.team) {
        $$invalidate(
          "opportunityCost",
          (opportunityCost =
            ((wastedHoursProject * (billable || initial.billable)) /
              52 /
              5 /
              8) *
            (team || initial.team))
        );
      }
      if ($$dirty.wastedHoursProject) {
        $$invalidate(
          "billableHoursYearly",
          (billableHoursYearly = wastedHoursProject * 52)
        );
      }
      if ($$dirty.billableHoursYearly || $$dirty.billable || $$dirty.team);
      if ($$dirty.billableHoursYearly || $$dirty.billable || $$dirty.team) {
        $$invalidate(
          "revenueIncreaseTeam",
          (revenueIncreaseTeam =
            ((billableHoursYearly * (billable || initial.billable)) /
              12 /
              20 /
              8) *
              (team || initial.team) -
            49 * 12)
        );
      }
      if ($$dirty.billableHoursYearly || $$dirty.billable || $$dirty.team) {
        $$invalidate(
          "revenueIncreaseOrg",
          (revenueIncreaseOrg =
            ((billableHoursYearly * (billable || initial.billable)) /
              12 /
              4 /
              5 /
              8) *
              (team || initial.team) -
            119 * 12)
        );
      }
      if (
        $$dirty.team ||
        $$dirty.billable ||
        $$dirty.expense ||
        $$dirty.bills ||
        $$dirty.vendors ||
        $$dirty.communicationVendors
      ) {
        {
          const data = [
            Math.abs(team),
            Math.abs(billable),
            Math.abs(expense),
            Math.abs(bills),
            Math.abs(vendors),
            Math.abs(communicationVendors),
          ];
          const qs = new URLSearchParams(window.location.search);
          qs.set("roi_brand", data.join("-"));
          $$invalidate(
            "shareableLink",
            (shareableLink = `${stripQueryString(
              window.location.href
            )}?${qs.toString()}`)
          );
        }
      }
    };

    return {
      initial,
      decimalOptions,
      integerOptions,
      currencyOptions,
      showExplanation,
      firstInput,
      shareableLink,
      linkCopyFeedback,
      team,
      billable,
      expense,
      bills,
      vendors,
      start,
      copyLink,
      wastedHoursProject,
      opportunityCost,
      billableHoursYearly,
      revenueIncreaseTeam,
      revenueIncreaseOrg,
      input0_input_handler,
      input0_binding,
      input1_input_handler,
      input2_input_handler,
      input3_input_handler,
      input4_input_handler,
      change_handler,
    };
  }

  class RoiCalculator extends SvelteComponentDev {
    constructor(options) {
      super(options);
      init(this, options, instance, create_fragment, safe_not_equal, []);
    }
  }

  const app = new RoiCalculator({
    target: document.getElementById("roi-calculator"),
  });

  return app;
})();
//# sourceMappingURL=bundle.js.map
