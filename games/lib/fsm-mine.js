/*

 Javascript State Machine Library - https://github.com/jakesgordon/javascript-state-machine

 Copyright (c) 2012, 2013, 2014, 2015, Jake Gordon and contributors
 Released under the MIT license - https://github.com/jakesgordon/javascript-state-machine/blob/master/LICENSE

 */

(function () {

  var StateMachine = {

    //---------------------------------------------------------------------------

    VERSION: "2.3.5",

    //---------------------------------------------------------------------------

    Result: {
      SUCCEEDED:    1, // 调用转换事件成功，状态转换成功
      NOTRANSITION: 2, // 调用转换事件成功，但状态不需要转换（因为当前状态为事件的结果状态）
      CANCELLED:    3, // 转换事件在beforeEvent回调中被取消
      PENDING:      4  // 触发了一个异步转换
    },

    Error: {
      INVALID_TRANSITION: 100, // 触发的转换事件不适用于当前状态
      PENDING_TRANSITION: 200, // 异步转换未结束时调用转换事件
      INVALID_CALLBACK:   300  // 调用者的回调函数抛出异常
    },

    WILDCARD: '*',  // 通配符
    ASYNC: 'async', //

    //---------------------------------------------------------------------------

    /**
     cfg 结构:
     {
       initial {String|Object}: 
         - {String} : 初始状态 'foo'
         - {Object} : { state: 'foo', event: 'setup', defer: true|false }
         - defer: 是否延迟调用第一个事件（true，表示不自动初始化），默认 false
         
       events {Array} : [ { name: '', from: []|'', to: '' } ]
         - {name: 事件名, from: 原始状态，可为数组/字符串, to: 目标状态，唯一}
         
       terminal/final : 结束状态
     }
     target: 一个 fsm 对象，可选
     */
    create: function(cfg, target) {
      // cfg.inital 可以是一个字符串(state)或对象 { state: 'foo', event: 'setup', defer: true|false }
      var initial      = (typeof cfg.initial == 'string') ? { state: cfg.initial } : cfg.initial;
      var terminal     = cfg.terminal || cfg['final']; // 结束状态
      var fsm          = target || cfg.target  || {};  // fsm对象
      var events       = cfg.events || [];             // 事件数组
      var callbacks    = cfg.callbacks || {};          // 回调函数对象
      var map          = {};                           // 用来判断事件是否适用于当前状态，结构：{ event: { from: to } }
      var transitions  = {};                           // 用来判断当前状态下，有哪些可用的事件，结构：{ state: [ event ] }

      // 将一个事件添加到 map、transitions 对象中
      var add = function(e) {
        // 事件的原始状态 from，可为数组，未定义则表示全部 ['*']
        var from = (e.from instanceof Array) ? e.from : (e.from ? [e.from] : [StateMachine.WILDCARD]);
        map[e.name] = map[e.name] || {};
        for (var n = 0 ; n < from.length ; n++) {
          transitions[from[n]] = transitions[from[n]] || [];
          transitions[from[n]].push(e.name);

          map[e.name][from[n]] = e.to || from[n]; // allow no-op transition if 'to' is not specified
        }
      };

      // 添加 initial 初始状态、事件（默认 startup）
      if (initial) {
        initial.event = initial.event || 'startup';
        add({ name: initial.event, from: 'none', to: initial.state });
      }

      // 添加所有事件
      for(var n = 0 ; n < events.length ; n++)
        add(events[n]);

      // 生成各个事件的状态转换方法
      for(var name in map) {
        if (map.hasOwnProperty(name))
          fsm[name] = StateMachine.buildEvent(name, map[name]);
      }

      for(name in callbacks) {
        if (callbacks.hasOwnProperty(name))
          fsm[name] = callbacks[name]
      }

      fsm.current     = 'none';
      fsm.is          = function(state) { return (state instanceof Array) ? (state.indexOf(this.current) >= 0) : (this.current === state); };
      fsm.can         = function(event) { return !this.transition && (map[event].hasOwnProperty(this.current) || map[event].hasOwnProperty(StateMachine.WILDCARD)); };
      fsm.cannot      = function(event) { return !this.can(event); };
      fsm.transitions = function()      { return transitions[this.current]; };
      fsm.isFinished  = function()      { return this.is(terminal); };
      fsm.error       = cfg.error || function(name, from, to, args, error, msg, e) { throw e || msg; }; // default behavior when something unexpected happens is to throw an exception, but caller can override this behavior if desired (see github issue #3 and #17)

      // 自动初始化，过度到第一个状态，defer==true 表示不自动进行初始化
      if (initial && !initial.defer)
        fsm[initial.event]();

      return fsm;

    },

    //===========================================================================

    /*
      事件转换函数，在 cfg.callbacks 对象中，其中key函数名可以为：
      5个所有事件转换通用的函数（执行顺序：依次）：
         onbeforeevent - fired before any event
         onleavestate - fired when leaving any state
         onenterstate - fired when entering any state
         onafterevent - fired after any event
        
      另外每个事件独立的函数命名为（其中 EVENT 为事件名）（执行顺序：依次）：
         onbeforeEVENT - fired before the event
         onleaveSTATE - fired when leaving the old state
         onenterSTATE - fired when entering the new state
         onafterEVENT - fired after the event
         
      上述9个函数如果不需要区分 before/after，leave/enter，可以用替换为（执行顺序：依次）：
         onstate - convenience shorthand for onenterstate
         onSTATE - convenience shorthand for onenterSTATE
         onevent - convenience shorthand for onafterevent
         onEVENT - convenience shorthand for onafterEVENT

      它们的参数都是：
         event name
         from state
         to state
         (followed by any arguments you passed into the original event method)
     */
    
    doCallback: function(fsm, func, name, from, to, args) {
      if (func) {
        try {
          return func.apply(fsm, [name, from, to].concat(args));
        }
        catch(e) {
          return fsm.error(name, from, to, args, StateMachine.Error.INVALID_CALLBACK, "an exception occurred in a caller-provided callback function", e);
        }
      }
    },

    beforeAnyEvent:  function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onbeforeevent'],                       name, from, to, args); },
    afterAnyEvent:   function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onafterevent'] || fsm['onevent'],      name, from, to, args); },
    leaveAnyState:   function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onleavestate'],                        name, from, to, args); },
    enterAnyState:   function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onenterstate'] || fsm['onstate'],      name, from, to, args); },

    beforeThisEvent: function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onbefore' + name],                     name, from, to, args); },
    afterThisEvent:  function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onafter'  + name] || fsm['on' + name], name, from, to, args); },
    leaveThisState:  function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onleave'  + from],                     name, from, to, args); },
    enterThisState:  function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onenter'  + to]   || fsm['on' + to],   name, from, to, args); },

    beforeEvent: function(fsm, name, from, to, args) {
      if ((false === StateMachine.beforeThisEvent(fsm, name, from, to, args)) ||
        (false === StateMachine.beforeAnyEvent( fsm, name, from, to, args)))
        return false;
    },

    afterEvent: function(fsm, name, from, to, args) {
      StateMachine.afterThisEvent(fsm, name, from, to, args);
      StateMachine.afterAnyEvent( fsm, name, from, to, args);
    },

    leaveState: function(fsm, name, from, to, args) {
      var specific = StateMachine.leaveThisState(fsm, name, from, to, args),
        general  = StateMachine.leaveAnyState( fsm, name, from, to, args);
      if ((false === specific) || (false === general))
        return false;
      else if ((StateMachine.ASYNC === specific) || (StateMachine.ASYNC === general))
        return StateMachine.ASYNC;
    },

    enterState: function(fsm, name, from, to, args) {
      StateMachine.enterThisState(fsm, name, from, to, args);
      StateMachine.enterAnyState( fsm, name, from, to, args);
    },

    //===========================================================================

    /**
     * 组装一个转换方法，提供给 fsm 对象的属性（与事件同名）
     *  - 执行顺序：beforeEvent leaveState enterState afterEvent
     *    - 若 beforeEvent 返回 false，则执行 afterEvent 并结束
     *    - 若 leaveState 返回 false，则直接结束
     *    - 若 leaveState 返回 ASYNC，表示 leaveState 中有异步代码，需要在异步代码的回调中调用 transition() 继续执行后续的方法
     *      - 可以通过调用 fsm.transition.cancel(); 取消异步执行
     *    - 若 当前状态=目标状态，则只执行 beforeEvent afterEvent，无状态改变
     *    
     * @param name {String} 事件 
     * @param map  {Array}  from:to 数组
     * @returns {Function}
     */
    buildEvent: function(name, map) {
      return function() {

        // prepare a transition method for use EITHER lower down, or by caller if they want an async transition (indicated by an ASYNC return value from leaveState)
        var fsm = this;
        
        var from  = fsm.current; // 当前状态
        var to    = map[from] || map[StateMachine.WILDCARD] || from; // 转换后的状态
        var args  = Array.prototype.slice.call(arguments); // turn arguments into pure array

        // fsm.transition 存在，说明：有正在进行中的转换（很可能存在异步的转换操作）
        if (fsm.transition)
          return fsm.error(name, from, to, args, StateMachine.Error.PENDING_TRANSITION, "event " + name + " inappropriate because previous transition did not complete");

        // 事件不支持对当前状态进行转换
        if (fsm.cannot(name))
          return fsm.error(name, from, to, args, StateMachine.Error.INVALID_TRANSITION, "event " + name + " inappropriate in current state " + this.current);

        // 执行 beforeEvent，如果返回 false，则终止状态的转换
        if (false === StateMachine.beforeEvent(this, name, from, to, args))
          return StateMachine.Result.CANCELLED;

        // 如果 当前状态为事件的结果状态 ，则直接执行 afterEvent 并结束转换
        if (from === to) {
          StateMachine.afterEvent(this, name, from, to, args);
          return StateMachine.Result.NOTRANSITION;
        }
        
        // 执行具体的转换操作
        fsm.transition = function() {
          fsm.transition = null; // this method should only ever be called once
          fsm.current = to;
          StateMachine.enterState( fsm, name, from, to, args);
          StateMachine.afterEvent( fsm, name, from, to, args);
          return StateMachine.Result.SUCCEEDED;
        };
        fsm.transition.cancel = function() { // provide a way for caller to cancel async transition if desired (issue #22)
          fsm.transition = null;
          StateMachine.afterEvent(fsm, name, from, to, args);
        };

        var leave = StateMachine.leaveState(this, name, from, to, args);
        if (false === leave) {
          fsm.transition = null;
          return StateMachine.Result.CANCELLED;
        }
        else if (StateMachine.ASYNC === leave) {
          return StateMachine.Result.PENDING;
        }
        else {
          if (fsm.transition) // need to check in case user manually called transition() but forgot to return StateMachine.ASYNC
            return fsm.transition();
        }

      };
    }

  }; // StateMachine

  //===========================================================================

  //======
  // NODE
  //======
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = StateMachine;
    }
    exports.StateMachine = StateMachine;
  }
  //============
  // AMD/REQUIRE
  //============
  else if (typeof define === 'function' && define.amd) {
    define(function(require) { return StateMachine; });
  }
  //========
  // BROWSER
  //========
  else if (typeof window !== 'undefined') {
    window.StateMachine = StateMachine;
  }
  //===========
  // WEB WORKER
  //===========
  else if (typeof self !== 'undefined') {
    self.StateMachine = StateMachine;
  }

}());

