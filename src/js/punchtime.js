var PunchTime = null;

(function($, undefined) {
    PunchTime = function(timeIn, timeOut, isMissing) {
        this.forgotPunch = false;
        this.lowHours = false;
        this.forgotPunchCount = 0;
        this.requiredWorkHours = 8;
        this.isMissing = (isMissing == undefined ? false : isMissing);
        this.forgotOrMissingText = 'QUÊN/NGHỈ';
        this.forgotText = 'QUÊN ';
        this.remindText = 'NHỚ ';
        if (timeIn == '') {
            timeIn = timeOut;
            this.forgotPunch = 'in';
            this.forgotPunchCount = 1;
        }

        if (timeOut ==  '') {
            timeOut = timeIn;
            this.forgotPunch = 'out';
            this.forgotPunchCount = 1;
        }

        if (this.isMissing) {
            this.forgotPunchCount = 1;
        }

        this.timeIn = moment(timeIn);
        this.timeOut = moment(timeOut);
        this.smartTime = 0;
        this.stupidTime = 0;
        this.isToday = moment().isSame(this.timeIn, 'day');
        // Do not count work hour for today before punch out
        if (this.isToday && (this.isMissing || this.forgotPunch)) {
            this.requiredWorkHours = 0;
            this.forgotPunchCount = 0;
        }
        this.calculateWorkTime();
    };

    PunchTime.prototype.calculateWorkTime = function() {
        if (this.forgotPunch || this.isMissing) {
            return;
        }

        var timeIn = this.timeIn;
        var timeOut = this.timeOut;
        var workStart = moment(timeIn).hour(7).minute(0).second(0);
        var stupidTime1 = workStart.diff(timeIn, 'hours', true);
        if (stupidTime1 < 0) stupidTime1 = 0;
        workStart = moment.max(workStart, timeIn); // worktime count from 7:00 AM

        var workEnd = moment(timeIn).hour(18).minutes(30).second(0);
        workEnd = moment.min(workEnd, timeOut); // worktime count to 6:30 PM
        var stupidTime2 = timeOut.diff(workEnd, 'hours', true);
        if (stupidTime2 < 0) stupidTime2 = 0;

        if (timeIn.isAfter(workEnd) || timeOut.isBefore(workStart)) {
            this.smartTime = 0;
            this.stupidTime = timeOut.diff(timeIn, 'hours', true);
            this.lowHours = true;
            return;
        }

        /**
         * How lunch time is taken into account in calculation:
         *
         *                  | IN bef. 12h       | IN 12h - 1h15     |	IN aft. 1h15
         * OUT bef. 12h	    | OUT - IN	        |       x	        |       x
         * OUT 12h - 1h15	| OUT - IN - diff	|       x	        |       x
         * OUT aft. 1h15	| OUT - IN - 1.25	| OUT - IN - diff	|   OUT - IN
         *
         */
        var lunchStart = moment(timeIn).hour(12).minute(0).second(0);
        var lunchEnd = moment(lunchStart).hour(13).minute(15).second(0);
        var lunchTime = 0;

        if (workStart.isBefore(lunchStart)) {
            lunchTime = workEnd.isAfter(lunchEnd) ? 1.25 : (1.25 - lunchEnd.diff(workEnd, 'hours', true));
        } else { // workStart is after lunchStart
            lunchTime = workStart.isAfter(lunchEnd) ? 0 : (1.25 - lunchEnd.diff(workStart, 'hours', true));
        }

        this.smartTime = workEnd.diff(workStart, 'hours', true) - lunchTime;

        var theDate = moment(this.timeIn).format('DDMMYYYY') + '=';
        var cookies = document.cookie;
        cookies = cookies.split('; ');

        for (var i = 0; i < cookies.length; i++) {
            if (theDate == cookies[i]) {
                this.smartTime = 8;
                break;
            }
        }

        this.stupidTime = stupidTime1 + stupidTime2;
        this.lowHours = this.smartTime < 5;
    };

    PunchTime.prototype.isAfter = function(another) {
        return this.timeIn.isAfter(another.timeIn);
    };

    PunchTime.prototype.toHtml = function() {
        return this.getDate() + ' - ' + this.getPunchIn() + ' - ' + this.getPunchOut() + ' - ' + this.getSmartTime() + ' - ' + this.getStupidTime() + '<br/>';
    };

    PunchTime.prototype.getDate = function() {
        var clone = moment(this.timeIn);
        clone.locale('vi');
        return clone.format('dddd, D/M');
    };

    PunchTime.prototype.getPunchIn = function() {
        if (this.forgotPunch == 'in' || this.isMissing) {
            return this.isToday ? this.remindText + 'PUNCH IN'
                : (this.isMissing ? this.forgotOrMissingText : this.forgotText + 'PUNCH IN');
        } else {
            return this.timeIn.format('LT');
        }
    };

    PunchTime.prototype.getPunchOut = function() {
        if (this.forgotPunch == 'out' || this.isMissing) {
            return this.isToday ? this.remindText + 'PUNCH OUT'
                : (this.isMissing ? this.forgotOrMissingText : this.forgotText + 'PUNCH OUT');
        } else {
            return this.timeOut.format('LT');
        }
    };

    PunchTime.prototype.getSmartTime = function() {
        return this.smartTime.toFixed(2);
    };

    PunchTime.prototype.getStupidTime = function() {
        return this.stupidTime.toFixed(2);
    };

    PunchTime.prototype.getCheck = function() {
        var theDate = moment(this.timeIn).format('DDMMYYYY') + '=';
        var cookies = document.cookie;
        cookies = cookies.split('; ');

        for (var i = 0; i < cookies.length; i++) {
           if (theDate == cookies[i]) {
                return 'checked';
           }
        }
        return;
    }

    PunchTime.prototype.getDateName = function() {
        var theDate = moment(this.timeIn).format('DDMMYYYY');
        return theDate;
    }

})(jQuery);