(function() {
  'use strict';

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  /**
   * 构建类之间的继承关系
   *
   * @param {Function} subClass 子类函数
   * @param {Function} superClass 父类函数
   */
  function inherits(subClass, superClass) {
    var F = new Function();
    F.prototype = superClass.prototype;
    subClass.prototype = new F();
    subClass.prototype.constructor = subClass;
  }

  function Event() {
    // 定义一个空对象,存放事件名和事件处理函数数组
    this._envets = {};
  }

  Event.prototype.on = function(type, fn) {
    if (!this._events[type]) {
      this._events[type] = [];
    }
    this._events[type].push(fn);
  };

  Event.prototype.off = function(type, fn) {
    if (!this._events[type]) {
      return;
    }
    var index = this._events[type].indexOf(fn);
    if (index > -1) {
      this._events[type].splice(index, 1);
    }
  };

  Event.prototype.trigger = function(type) {
    if (!this._events[type]) {
      console.log('触发的事件--' + type + '--不存在')
      return;
    }

    var l = this._events[type].length;
    if (!l) {
      console.log('触发的事件--' + type + '--未绑定处理函数')
      return;
    }

    for (var i = 0; i < l; i++) {
      this._events[type][i].apply(this, [].slice.call(arguments, 1));
    }
  };

  function TimeCounter(options) {

    Event.call(this);
    /**
     * Default attributes
     *
     * @type {{autostart: boolean, hours: number, minutes: number, seconds: number, timeString: string}}
     */
    var defaults = this.defaults = {
      autostart: false,
      hours: 0,
      minutes: 0,
      seconds: 0,
      timeString: '00:00:00',
      interval: 200, // 单位ms
    };

    if (options instanceof Object) {
      // obj = given option object.
      // Run through the defaults to replace the defaults with the given options
      var key;

      for (key in defaults) {
        if (options[key] !== undefined) {
          defaults[key] = options[key];
        }
      }
    }

    this._intervalTimer = null;

    this.setTime(defaults);
    if (defaults.autostart) {
      this.start();
    }
  }

  inherits(TimeCounter, Event); // 使TimeCounter 继承 Event

  // 工具常量
  TimeCounter.TICK = 'tick';
  TimeCounter.RESET = 'reset';
  TimeCounter.SETTIME = 'settime';



  /**
   * Define class methods.
   */
  TimeCounter.prototype = {

    /**
     * Starts the counter
     */
    start: function() {

      // start the timer if it is not running.
      if (this._intervalTimer !== undefined) {
        if (this._isPaused) {
          this.resumeCounting();
        }
        return false;
      }
      // 每隔 
      this._intervalTimer = setInterval(function() { this.tick() }.bind(this), this.defaults.interval);
    },

    /**
     * Stops counter and reset props
     */
    stop: function() {

      // do the clearing only if the timer is currently running
      if (this._intervalTimer === undefined) {
        return false;
      }

      console.log('Stop time counting at: ' + this.getTime());
      clearInterval(this._intervalTimer);
      this._intervalTimer = undefined;
      this._isPaused = false;
      this.resetTimeProps();
    },

    /**
     * Resets the whole counter and start it again.
     */
    reset: function() {

      console.log('Reset time counting at: ' + this.getTime());
      this.resetTimeProps();
      this.trigger(TimeCounter.RESET);
    },

    /**
     * Pauses the current time counting
     */
    pause: function() {
      if (this._intervalTimer === undefined) {
        return false;
      }

      if (!this._isPaused) {
        console.log('Pause the counting at : ' + this.getTime());
        this._isPaused = true;
      } else {
        this.resumeCounting();
      }
    },

    /**
     * Resumes the time counting
     */
    resumeCounting: function() {
      if (this._isPaused) {
        console.log('Resume time counting on: ' + this.getTime());
        this._isPaused = false;
      }
    },

    /**
     * Resets the counter props
     */
    resetTimeProps: function() {
      this._seconds = this._minutes = this._hours = 0;
    },

    /**
     * Returns the whole time string.
     */
    getTime: function() {
      return [this.formatNumber(this._hours), this.formatNumber(this._minutes), this.formatNumber(this._seconds)].join(':');
    },

    /**
     * Sets the time of the time counter.
     */
    setTime: function(opts) {
      var options = opts || {};
      var hrs = 0;
      var mins = 0;
      var secs = 0;

      if (Object.keys(options).length) {
        if (options.timeString !== undefined && options.timeString != '00:00:00') {
          // user given time string!
          // If the user specify a time string and the separate times (hours, minutes and seconds),
          // prefer the time string instead.
          var times = options.timeString.split(':');
          if (times.length === 3) {
            hrs = (!isNaN(times[0])) ? parseInt(times[0]) : 0;
            mins = (!isNaN(times[1])) ? parseInt(times[1]) : 0;
            secs = (!isNaN(times[2])) ? parseInt(times[2]) : 0;
          } else {
            throw new SyntaxError('The given time string is invalid! Please use the following format "hh:mm:ss". Given time is: ' + options.timeString);
          }
        } else {
          // user gives the times separately.
          hrs = (!isNaN(options.hours)) ? parseInt(options.hours) : 0;
          mins = (!isNaN(options.minutes)) ? parseInt(options.minutes) : 0;
          secs = (!isNaN(options.seconds)) ? parseInt(options.seconds) : 0;
        }

        // If the given seconds are greater than 59,
        // then throw an error.
        if (secs > 59) {
          throw new Error('Seconds must be between 0 - 59');
        }

        // If the given minutes are greater than 59,
        // then throw an error.
        if (mins > 59) {
          throw new Error('Minutes must be between 0 - 59');
        }

        this._hours = hrs;
        this._minutes = mins;
        this._seconds = secs;

      } else {
        if (opts === undefined) {
          throw new SyntaxError('No arguments was given!');
        }
      }
      // 触发settime回调
      this.trigger(TimeCounter.SETTIME);
    },

    /**
     * Sets the starting time by a given date.
     *
     * @param date
     * @param autoplay
     */
    setTimeByDate: function(date, autoplay) {

      if (date === undefined || !date instanceof Date) {
        throw new SyntaxError('The given date is not an instance of Date');
      }

      this.setTime({ hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds() });

      if (autoplay !== undefined && autoplay) {
        this.start();
      }
    },

    /**
     * Handler called on each tick of the timer.
     */
    tick: function() {
      if (!this._isPaused) {
        this._seconds++;

        if (this._seconds % 60 === 0) {
          // have one minute completed
          this._seconds = 0;
          this._minutes++;

          if (this._minutes % 60 === 0) {
            // have an hour completed
            this._minutes = 0;
            this._hours++;
          }
        }
        this.trigger(TimeCounter.TICK);
      }
    },

    /**
     * Triggers a specific TimeCounter-Event includes the time.
     *
     * @param type
     */
    trigger: function(type) {
      if (type !== undefined) {
        var ev = new CustomEvent('TimeCounter:' + type, { 'detail': { 'time': this.getTime() } });
        document.dispatchEvent(ev);
      }
    },

    /**
     * 'Formats' the given number
     *
     * @param number int
     */
    formatNumber: function(number) {
      return (number < 10) ? '0' + number : number;
    }
  };

  // Export the TimeCounter object for **Node.js**, with
  // backwards-compatibility for the old `require()` API.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = TimeCounter;
    }
    exports.TimeCounter = TimeCounter;
  } else {
    root.TimeCounter = TimeCounter;
  }

  /**
   * AMD registration happens at the end for compatibility with AMD loaders
   * that may not enforce next-turn semantics on modules. Even though general
   * practice for AMD registration is to be anonymous, TimeCounter registers
   * as a unnamed module.
   */
  if (typeof define === 'function' && define.amd) {
    define(function() {
      return TimeCounter;
    });
  }

}).call(this);
