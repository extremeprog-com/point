Timer = function() {
    var t0;
    var currentTime = 0;
    this.playing = false;
    var Timer = this;

    function Timer_Started() {
        runAllTimeouts();
    }

    function Timer_Stopped() {
        stopAllTimeouts();
    }

    function Timer_CurrentTimeMoved() {
        rerunAllTimeouts();
    }

    this.start = function() {
        if(!this.playing) {
            this.playing = true;
            t0 = new Date - currentTime;
            Timer_Started();
        }
        return this;
    };

    this.stop = function() {
        if(this.playing) {
            this.playing = false;
            currentTime = new Date - t0;
            Timer_Stopped();
        }
        return this;
    };

    this.currentTime = function() {
        if(this.playing) {
            return (new Date - t0) / 1000;
        } else {
            return currentTime / 1000;
        }
    };

    this.setTime = function(time) {
        if(this.playing) {
            t0 = new Date - time * 1000;
            Timer_CurrentTimeMoved()
        } else {
            currentTime = time * 1000;
            Timer_CurrentTimeMoved()
        }
        return this;
    };

    var TimerCallbacks = this;

    TimerCallbacks.callbacks = []; // cb_model format: [cb, time, _timeout]

    //this.sd = callbacks;

    function TimerCallbacks_Added(cb_model) {
        runTimeout(cb_model);
    }

    function TimerCallbacks_Removed(cb_model) {
        stopTimeout(cb_model);
    }

    function TimerCallbacks_Time(cb_model) {
        executeCallback(cb_model);
        deleteCallback(cb_model);
    }

    function addCallback(cb, time) {
        var cb_model = [cb, time];
        TimerCallbacks.callbacks.push(cb_model);
        TimerCallbacks_Added(cb_model);
    }

    function runTimeout(cb_model) {
        // on TimerCallbacks_Added
        if(Timer.playing) {
            var currentTime = Timer.currentTime() * 1000;
            if(cb_model[1] >= currentTime) {
                cb_model[2] = setTimeout(function() {
                    TimerCallbacks_Time(cb_model);
                }, cb_model[1] - currentTime)
            } else {
                deleteCallback(cb_model)
            }
        }
    }

    function stopTimeout(cb_model) {
        clearTimeout(cb_model[2]);
    }

    function deleteCallback(cb_model) {
        // on TimerCallbacks_Time
        TimerCallbacks.callbacks.splice(TimerCallbacks.callbacks.indexOf(cb_model), 1);
        TimerCallbacks_Removed(cb_model);
    }

    function runAllTimeouts() {
        // on Timer_Started
        for(var i = 0; i < TimerCallbacks.callbacks.length; i++) {
            runTimeout(TimerCallbacks.callbacks[i]);
        }
    }

    function stopAllTimeouts() {
        // on Timer_Stopped
        for(var i = 0; i < TimerCallbacks.callbacks.length; i++) {
            stopTimeout(TimerCallbacks.callbacks[i]);
        }
    }

    function rerunAllTimeouts() {
        // on Timer_CurrentTimeMoved
        stopAllTimeouts();
        runAllTimeouts();
    }

    function executeCallback(cb_model) {
        // on TimerCallbacks_Time
        cb_model[0]();
    }

    this.onTime = function(time, cb) {
        addCallback(cb, time * 1000);
    }

};