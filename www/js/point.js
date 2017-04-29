pointApp.controller('point', ['$scope', '$interval', '$timeout', 'vm', 'countdown', 'timeProcessing', function ($scope, $interval, $timeout, vm, countdown, timeProcessing) {
  "use strict";
  window.scope = $scope;

  $scope.vm            = vm;
  var textenter        = {textenter: 1};
  $scope.textenter     = textenter;
  $scope.lastActions   = angular.fromJson(localStorage.lastActions) || null;
  $scope.rebase_period = 2 * 60 * 60 * 1000;

  var time_scale     = 60,
      default_time   = 2 * time_scale,
      sec_before_end = time_scale / 2,
      repeat_int     = 2 * time_scale; // repeat next message interval in sec


  // cordova plugins
  $scope.insomniaOn = function () {
    try {
      if ($scope.vm.play_index !== -1) {
        window.cordova.plugins.insomnia.keepAwake();
      }
    } catch (e) {
      console.error(e.message + ". --> No cordova plugin");
    }
  };

  $scope.insomniaOff = function () {
    try {
      window.cordova.plugins.insomnia.allowSleepAgain();
    } catch (e) {
      console.error(e.message + ". --> No cordova plugin");
    }
  };

  // timeouts id
  var _to1 = null;
  var _to2 = null;
  var _to3 = null;
  var _to4 = null;

  // update $scope.vm.list
  if (!localStorage.vmList || localStorage.vmList === 'undefined') {
    $scope.vm.list      = [textenter];
    localStorage.vmList = angular.toJson($scope.vm.list);
  } else {
    $scope.vm.list   = angular.fromJson(localStorage.vmList);
    textenter        = $scope.vm.list.filter(function (x) {
      return x.textenter == 1;
    })[0];
    $scope.textenter = textenter;
  }

  // write tasks to localStorage
  $scope.$watchCollection('vm.list', function () {
    localStorage.vmList = angular.toJson($scope.vm.list);
  }, true);

  // write old tasks to localStorage
  $scope.$watchCollection('vm.old_list', function () {
    localStorage.vmOldList = angular.toJson($scope.vm.old_list);
  }, true);

  // set interval to check time
  // save old task to new array
  // and clean local storage vmList
  $scope.startRebasePeriod = function () {
    $timeout.cancel(_to3);
    var now = Date.now();
    if ($scope.lastActions + $scope.rebase_period > now) {
      $scope.rebase_period = ($scope.lastActions + $scope.rebase_period) - now;
      _to3                 = $timeout(function () {
        $scope.vm.old_list  = $scope.vm.list.slice(0);
        localStorage.vmList = undefined;

        $timeout.cancel(_to3);

      }, $scope.rebase_period, true);
    }
  };

  $scope.startRebasePeriod();

  // update lastActions datetime
  $scope.updateLastActDate = function () {
    $interval.cancel(_to3);
    $scope.lastActions       = Date.now();
    localStorage.lastActions = angular.toJson($scope.lastActions);
    $scope.startRebasePeriod();
  };

  // catch user activity
  document.body.addEventListener('click', $scope.updateLastActDate, true);
  document.body.addEventListener('drag', $scope.updateLastActDate, true);
  document.body.addEventListener('keypress', $scope.updateLastActDate, true);
  $scope.$watch('msg', function () {
    $scope.updateLastActDate();
  }, true);

  $scope.util = Core.Class({
    /**
     * Returns plural suffix of unit
     *      plural(days, "%d день", "%d дня", "%d дней")
     *
     * @param {Number} num
     * @param {String} one
     * @param {String} two
     * @param {String} many
     * @returns {String}
     */
    plural: function (num, one, two, many) {
      return (function (num) {
        return (num == 1 && one)
          || (num && num < 5 && parseInt(num) == num && two) || many
      })
      (parseFloat(num) % 10 + (parseInt(num / 10) % 10 == 1 ? 1 : 0) * 10).replace(/%d/g, num);
    }
  });


  // functions for playing and stopping task

  /**
   * inits speaker
   * @param $index
   */
  function initPlay($index) {
    dropTimers();

    $scope.vm.play_index = $scope.vm.list.indexOf(textenter) > $index ? $index : -1;

    if ($scope.vm.play_index == -1) {
      return;
    }

    if (document.getElementById('timer') && $scope.vm.play_index !== -1) {
      countdown.removeTimer();
    }
  }

  function setTaskTimeout(taskTime) {
    _to2 = $timeout(function () {
      var idx      = $scope.vm.list.indexOf(textenter) <= ++$scope.vm.play_index ? 0 : $scope.vm.play_index;
      var item     = $scope.vm.list[idx];
      var taskTime = timeProcessing.parseTime(item) || default_time;
      $scope.play(idx, item, taskTime);
    }, taskTime * 1000, true);
  }

  function setNoticeBeforeEndTimeout(task, taskTime) {
    if (taskTime > sec_before_end) {
      _to1 = $timeout(function () {
        $scope.msg = sec_before_end + ' секунд до конца задачи ' + task;
      }, (taskTime - sec_before_end) * 1000, true);
    }
  }

  function setTask(task, item, taskTime /* In seconds! */) {
    var time = timeProcessing.timeToMinsAndSecs(taskTime)
    var mins = time[0];
    var secs = time[1];

    countdown.add(mins, secs, countdown.getParent($scope.vm.play_index));

    if (item) {
      // text of task without time in suffix
      var declensionedTime = (mins === 1) ? 'одну минуту '
        : $scope.util.plural(mins, "%d минуту ", "%d минуты ", "%d минут ");
      $scope.msg           = 'Задача на ' + declensionedTime + task;
    }

  }

  /**
   *
   * @param task - text to say
   * @param left_time - in seconds
   */
  function setLeftTimeout(task, endTime, $index) {

    var leftTime = endTime - Math.floor(Date.now() / 1000);

    if (leftTime > repeat_int) {
      var numOfIntervals = Math.floor(leftTime / repeat_int);

      var leftRepeatTime = numOfIntervals * repeat_int;
      var timeToNext     = leftTime - leftRepeatTime;

      if (timeToNext == 0) { // do not say anything immediately after launch
        timeToNext = repeat_int;
        leftRepeatTime -= repeat_int;
      }

      console.log("wait: ", timeToNext);

      _to4 = $timeout(function () {
        var minsLeft = timeProcessing.timeToMinsAndSecs(leftRepeatTime)[0];
        $scope.msg   = task + 'Осталось' +
          $scope.util.plural(minsLeft, "%d минута ", "%d минуты ", "%d минут ") +
          ' до конца задачи ';

        $timeout.cancel(_to4);
        if ($scope.vm.play_index === $index) { // if same task still in progress
          setLeftTimeout(task, endTime, $index);
        }
      }, timeToNext * 1000, true)
    }
  }


  /**
   * play task
   * @param $index
   * @param taskText
   * @param taskTime in seconds
   */
  $scope.play = function ($index, taskText, taskTime) {

    initPlay($index);

    var task = timeProcessing.trimTime($scope.vm.list[$scope.vm.play_index]);

    setTask(task, taskText, taskTime);

    setNoticeBeforeEndTimeout(task, taskTime);

    var endTime = Math.floor(Date.now() / 1000) + taskTime;

    setLeftTimeout(task, endTime, $index);

    setTaskTimeout(taskTime);

    $scope.$$phase || $scope.$apply();

  };

  function dropTimers() {
    $scope.insomniaOff();
    $timeout.cancel(_to1);
    $timeout.cancel(_to2);
    $timeout.cancel(_to4);
  }

  // stop task
  $scope.stopPlay = function () {
    dropTimers();
    $scope.msg           = null;
    $scope.vm.play_index = -1;

    countdown.removeTimer();
  };

  /**
   * control play, pause, delete button
   * @param $index - index of task
   * @param item - one task in vm.list
   */
  $scope.controlPlay = function ($index, item) {
    var taskTime = timeProcessing.parseTime(item) || default_time;
    if ($scope.vm.delete_index == $index) {

      $scope.vm.list.splice($index, 1);
      $scope.vm.delete_index = -1;

    } else if ($scope.vm.play_index != $index) {

      $scope.play($index, item, taskTime);

    } else if ($scope.vm.play_index == $index) {

      $scope.stopPlay();

    } else {
      $scope.vm.play_index == $index && $scope.play(-1, item, taskTime);
    }
  };


  // function for adding and subtracting 1 minute
  // from current task time


  function restart($index, mins, sec) {
    $scope.stopPlay();
    $scope.play($index, null, mins * 60 + sec)
  }

  /**
   * restart task after add or subtract 1 min
   * @param event
   * @param flag
   * @param index
   */
  $scope.changeTime = function (event, flag, index) {
    event.preventDefault();
    var mins, sec;
    if (flag) {
      mins = parseInt(timeProcessing.addMinute(timeProcessing.getCurrentTime('#timer')[0]));
      sec  = parseInt(timeProcessing.getCurrentTime('#timer')[1]);
    } else {
      mins = parseInt(timeProcessing.subtractsMinute(timeProcessing.getCurrentTime('#timer')[0]));
      sec  = parseInt(timeProcessing.getCurrentTime('#timer')[1]);
    }
    restart(index, mins, sec);
    $scope.$$phase || $scope.$apply();
  };


  $scope.onTextareFocus = function ($index) {
    $scope.this_task = $scope.vm.list[$index];
  };

  $scope.onTextareaBlur = function ($index, item) {
    $scope.vm.focus_index = -1;
    if ($scope.this_task !== $scope.vm.list[$index] &&
      $scope.vm.play_index !== -1 &&
      $scope.vm.play_index === $index) {
      var taskTime = timeProcessing.parseTime(item) || default_time;
      $scope.play($index, item, taskTime);
    }
  };


  $scope.onReorder = function (item, $fromIndex, $toIndex) {

    $scope.vm.list.splice($fromIndex, 1);
    $scope.vm.list.splice($toIndex, 0, item);

    // when task in progress
    if ($fromIndex == $scope.vm.play_index) {

      // when drag task to differed
      if (isDiffered($toIndex, $fromIndex)) {
        console.log("differed");
        $scope.vm.play_index = $fromIndex;
        var taskText         = $scope.vm.list[$fromIndex];
        $scope.stopPlay();
        var taskTime         = timeProcessing.parseTime(taskText) || default_time;
        $scope.play($fromIndex, taskText, taskTime);
      } else {

        $scope.vm.play_index = $toIndex;
        restartPlayOnDrag($scope.vm.play_index);

      }

      // when drag task up
    } else if ($scope.vm.play_index < $fromIndex && $scope.vm.play_index >= $toIndex) {
      $scope.vm.play_index += 1;
      restartPlayOnDrag($scope.vm.play_index);
      // when drag task down
    } else if ($scope.vm.play_index > $fromIndex && $scope.vm.play_index <= $toIndex) {
      $scope.vm.play_index -= 1;
      restartPlayOnDrag($scope.vm.play_index);
    }

    $scope.$$phase || $scope.$apply();
  };

  function restartPlayOnDrag(idx) {
    var mins     = timeProcessing.getCurrentTime('#timer')[0];
    var sec      = timeProcessing.getCurrentTime('#timer')[1];
    var taskTime = mins * 60 + sec;
    var taskText = $scope.vm.list[idx];
    $scope.play(idx, taskText, taskTime);
  }

  function isDiffered(toIndex, fromIndex) {
    var textenterIdx = $scope.vm.list.indexOf(textenter);
    return (toIndex > textenterIdx && (fromIndex < textenterIdx));
  }


}]);
