(function () {
  "use strict";

  pointApp.factory('vm', function () {
    return {
      old_list    : angular.fromJson(localStorage.vmOldList) || null,
      focus_index : -1,
      play_index  : -1,
      delete_index: -1
    }
  });

})();
