/**
 * Created by hiephm on 6/25/15.
 */
var timesheet = Util = Timesheet = null;

(function($, undefined) {
    Timesheet = function(opts) {
        opts = opts || {};

        var defaultOpts = {
            'month': new Date()
        };
        this.opts = $.extend(defaultOpts, opts);

        moment.locale('en', {week: {dow: 1}}); // Set Monday as start of week

        this.employeeId = null;
        this.domain = null;
        this.times = [];

        this.getDomain()
            .done(function(data) {
                if(data.indexOf('<title>SmartHRM login</title>') > -1) {
                    $('#content').html('<h2><a target="_blank" href="' + this.domain + '">Click here</a> to login to HR first, then refresh this page.</h2>');
                } else {
                    this.init();
                }
            }.bind(this))

            .fail(function() {
                $('#content').html('<h2>HR system is down! <a href="/manager.html">Click here</a> to retry.</h2>');
            })
    };

    Timesheet.prototype.getDomain = function() {
        var _this = this;
        return $.ajax({
            url: 'http://hr.smartosc.com',
            timeout: 1000
        })
            .then(
                function(data) {
                    _this.domain = 'http://hr.smartosc.com';
                    return data;
                },
                function() {
                    _this.domain = 'http://hrm.smartosc.com'
                    return $.ajax({
                        url: 'http://hrm.smartosc.com',
                        timeout: 10000
                    });
                }
            );
    };

    Timesheet.prototype.getUrl = function(path) {
        return this.domain + path;
    };

    Timesheet.prototype.init = function() {
        var _this = this;
        var startTime = Util.get21LastMonth(_this.opts.month);
        var chained = this.initPostData();
        var processes = [];
        while (moment().isAfter(startTime)) {
            processes.push(chained.then(this.getTimesheetId(startTime)).then(this.getTimesheetDetail.bind(this)).then( function (table) {
                _this.parseTimesheetDetail(table);
            }));
            startTime = Util.getNextMonday(startTime);
        }

        $.when.apply(null, processes).done(this.displayTimesheet.bind(this));
    };

    Timesheet.prototype.displayTimesheet = function() {
        this.times.sort(function(a, b) {
            return a.isAfter(b) ? 1 : -1;
        });

        var content = $('#content');
        var totalSmartTime = 0;
        var totalStupidTime = 0;
        var requiredWorkTime = 0;
        var forgotPunchCount = 0;
        var count = 0;
        $.each(this.times, function() {
            this.count = ++count;
            totalSmartTime += this.smartTime;
            totalStupidTime += this.stupidTime;
            requiredWorkTime += 8;
            if (this.forgotPunch) {
                forgotPunchCount++;
            }
        })

        var diff = totalSmartTime - requiredWorkTime;
        var note = diff > 0 ? 'Thừa ' + diff.toFixed(2) : 'Thiếu ' + (-1 * diff).toFixed(2);

        var totalAfterRecover = totalSmartTime + (8 * forgotPunchCount);
        var diff = totalAfterRecover - requiredWorkTime;
        var noteAfterRecover = diff > 0 ? 'Thừa ' + diff.toFixed(2) : 'Thiếu ' + (-1 * diff).toFixed(2);


        var template = $('#timesheet-template').html();
        var data = {
            'totalSmartTime': totalSmartTime.toFixed(2),
            'totalStupidTime': totalStupidTime.toFixed(2),
            'requiredWorkTime': requiredWorkTime,
            'note': note,
            'forgotPunchCount': forgotPunchCount,
            'totalAfterRecover': totalAfterRecover.toFixed(2),
            'noteAfterRecover': noteAfterRecover,
            'punchtimes': this.times
        }
        var rendered = Mustache.render(template, data);
        content.html(rendered);
    };

    Timesheet.prototype.parseTimesheetDetail = function(table) {
        var _this = this;
        table.find('tbody tr').each(function() {
            var timeIn = $(this).find('td:nth-child(4)').html().trim();
            var timeOut = $(this).find('td:nth-child(5)').html().trim();
            var punchTime = new PunchTime(timeIn, timeOut);
            _this.times.push(punchTime);
        });
    };

    Timesheet.prototype.initPostData = function() {
        var _this = this;
        return $.ajax({
            url: _this.getUrl('/lib/controllers/CentralController.php?timecode=Time&action=View_Current_Timesheet'),
        })
        .then(function(data) {
            var dom = $('<div/>').html(data);
            _this.employeeId = dom.find('input[name="txtEmployeeId"]').val();
        });
    };

    Timesheet.prototype.getTimesheetId = function(fromDate) {
        var _this = this;
        return function() {
            return $.ajax({
                url: _this.getUrl('/lib/controllers/CentralController.php?timecode=Time&action=View_Timesheet'),
                method: 'POST',
                data: {
                    txtEmployeeId: _this.employeeId,
                    txtTimesheetPeriodId: 1,
                    txtStartDate: Util.getFormattedMonday(fromDate),
                    txtEndDate: Util.getFormattedSunday(fromDate)
                }

            })
            .then(function (data) {
                var dom = $('<div/>').html(data);
                var id = dom.find('#txtTimesheetId').val();
                return id;
            });
        }
    };

    Timesheet.prototype.getTimesheetDetail = function(timesheetId) {
        return $.ajax({
            url: this.getUrl('/lib/controllers/CentralController.php?timecode=Time&action=View_Detail_Timesheet&id=' + timesheetId),
        })
        .then(function(data) {
            var table = $('<div/>').html(data).find('table');
            var html = table;
            return html;
        });
    };

    Util = {
        get21LastMonth: function(d) {
            var date = moment(d).set('date', 21).subtract(1, 'months');
            return date.day() == 0 ? date.add(1, 'days') : date;
        },

        getMonday: function(d) {
            return moment(d).startOf('week');
        },

        getFormattedMonday: function(d) {
            return Util.formatDate(Util.getMonday(d));
        },

        getFormattedSunday: function(d) {
            return Util.formatDate(moment(d).endOf('week'));
        },

        formatDate: function(d) {
            return moment(d).format('YYYY-MM-DD');
        },

        getNextMonday: function(d) {
            return Util.getMonday(moment(d).add(7, 'days'));
        }
    };


    PunchTime = function(timeIn, timeOut) {
        this.forgotPunch = false;
        this.forgotText = 'FORGOT';
        if (timeIn == '') {
            timeIn = timeOut;
            this.forgotPunch = 'in';
        }

        if (timeOut ==  '') {
            timeOut = timeIn;
            this.forgotPunch = 'out';
        }

        this.timeIn = moment(timeIn);
        this.timeOut = moment(timeOut);
        this.smartTime = 0;
        this.stupidTime = 0;
        this.calculateWorkTime();
    };

    PunchTime.prototype.calculateWorkTime = function() {
        if (this.forgotPunch) {
            return;
        }

        var timeIn = this.timeIn;
        var timeOut = this.timeOut;
        var workStart = moment(timeIn).hour(7).minute(30).second(0);
        var stupidTime1 = workStart.diff(timeIn, 'hours', true);
        if (stupidTime1 < 0) stupidTime1 = 0;
        workStart = moment.max(workStart, timeIn); // worktime count from 7:30 AM

        var workEnd = moment(timeIn).hour(18).minutes(30).second(0);
        workEnd = moment.min(workEnd, timeOut); // worktime count to 6:30 PM
        var stupidTime2 = timeOut.diff(workEnd, 'hours', true);
        if (stupidTime2 < 0) stupidTime2 = 0;

        var lunchBreak = moment(timeIn).hour(12).minute(0).second(0);
        var lunchTime = workStart.isBefore(lunchBreak) ? 1.25 : (1.25 - workStart.diff(lunchBreak, 'hours', true));
        if (lunchTime < 0) lunchTime = 0;

        this.smartTime = workEnd.diff(workStart, 'hours', true) - lunchTime;
        this.stupidTime = stupidTime1 + stupidTime2;
    };

    PunchTime.prototype.isAfter = function(another) {
        return this.timeIn.isAfter(another.timeIn);
    };

    PunchTime.prototype.toHtml = function() {
        return this.getDate() + ' - ' + this.getPunchIn() + ' - ' + this.getPunchOut() + ' - ' + this.getSmartTime() + ' - ' + this.getStupidTime() + '<br/>';
    };

    PunchTime.prototype.getDate = function() {
        return this.timeIn.format('ddd, LL');
    };

    PunchTime.prototype.getPunchIn = function() {
        return this.forgotPunch == 'in' ? this.forgotText : this.timeIn.format('LT');
    };

    PunchTime.prototype.getPunchOut = function() {
        return this.forgotPunch == 'out' ? this.forgotText : this.timeOut.format('LT');
    };

    PunchTime.prototype.getSmartTime = function() {
        return this.smartTime.toFixed(2);
    };

    PunchTime.prototype.getStupidTime = function() {
        return this.stupidTime.toFixed(2);
    };

})(jQuery);

document.addEventListener('DOMContentLoaded', function() {
    timesheet = new Timesheet();
});
