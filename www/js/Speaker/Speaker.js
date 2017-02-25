/** @name Speaker_FragmentStart */
Core.registerEventPoint('Speaker_FragmentStart');
/** @name Speaker_FragmentEnd */
Core.registerEventPoint('Speaker_FragmentEnd');
/** @name Speaker_PhraseStart */
Core.registerEventPoint('Speaker_PhraseStart');
/** @name Speaker_PhraseEnd */
Core.registerEventPoint('Speaker_PhraseEnd');
/** @name Speaker_NoInternet */
Core.registerEventPoint('Speaker_NoInternet');

/** @name SpeakerUser_TokenizeRq */
Core.registerRequestPoint('SpeakerUser_TokenizeRq');
/** @name SpeakerUser_SayRq */
/** @name SpeakerUser_SayRq_Success */
/** @name SpeakerUser_SayRq */
Core.registerRequestPoint('SpeakerUser_SayRq');
/** @name SpeakerUser_CancelRq */
Core.registerRequestPoint('SpeakerUser_CancelRq', {log: false});

classes.Speaker = Core.Class({
    fragments: [],
    speaking: false,
    updateSpeaking: function() {
        var event = CatchEvent(SpeakerUser_SayRq_Start, SpeakerUser_SayRq_Success, SpeakerUser_SayRq_Fail);

        if(event instanceof SpeakerUser_SayRq_Start) {
            this.speaking = true;
        } else {
            this.speaking = false;
        }

        if(window.$scope) {
            $scope.$$phase || $scope.$apply();
        }
    },
    updateFragments: function() {
        var event = CatchEvent(Speaker_FragmentStart, SpeakerUser_SayRq_Start);
        if(event instanceof Speaker_FragmentStart) {
            this.fragments.push(event.fragment);
        }
        if(event instanceof SpeakerUser_SayRq_Start) {
            this.fragments = []
        }
        if(window.angular && window.$scope) {
            $scope.$$phase || $scope.$apply();
        }
    }
});