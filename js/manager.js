/**
 * Created by hiephm on 6/25/15.
 */
var timesheet = Util = Timesheet = null;

(function($, undefined) {
    Timesheet = function(opts) {
        opts = opts || {};

        var defaultOpts = {
            'url': 'http://hrm.smartosc.com',
            'month': new Date()
        };
        this.opts = $.extend(defaultOpts, opts);

        moment.locale('en', {week: {dow: 1}}); // Set Monday as start of week

        this.employeeId = null;

        if (this.isLoggedIn()) {
            this.init();
        }
    }

    Timesheet.prototype.init = function() {
        this.initPostData();
        var startTime = Util.get21LastMonth(this.opts.month);
        var timesheetId = this.getTimesheetId(startTime);
        $('#content').append(this.getTimesheetDetail(timesheetId));

        startTime = Util.getNextMonday(startTime);
        var timesheetId = this.getTimesheetId(startTime);
        $('#content').append(this.getTimesheetDetail(timesheetId));

        startTime = Util.getNextMonday(startTime);
        var timesheetId = this.getTimesheetId(startTime);
        $('#content').append(this.getTimesheetDetail(timesheetId));

    }

    Timesheet.prototype.initPostData = function() {
        var _this = this;
        $.ajax({
            url: 'http://hrm.smartosc.com/lib/controllers/CentralController.php?timecode=Time&action=View_Current_Timesheet',
            async: false
        })
            .done(function(data) {
                var dom = $('<div/>').html(data);
                _this.employeeId = dom.find('input[name="txtEmployeeId"]').val();
            });

    }

    Timesheet.prototype.getTimesheetId = function(fromDate) {
        var _this = this;
        var id = null;
        $.ajax({
            url: 'http://hrm.smartosc.com/lib/controllers/CentralController.php?timecode=Time&action=View_Timesheet',
            method: 'POST',
            async: false,
            data: {
                txtEmployeeId: _this.employeeId,
                txtTimesheetPeriodId: 1,
                txtStartDate: Util.getFormattedMonday(fromDate),
                txtEndDate: Util.getFormattedSunday(fromDate)
            }

        })
            .done(function(data) {
                var dom = $('<div/>').html(data);
                id = dom.find('#txtTimesheetId').val();
            });

        return id;
    }

    Timesheet.prototype.getTimesheetDetail = function(timesheetId) {
        var html = null;
        $.ajax({
            url: 'http://hrm.smartosc.com/lib/controllers/CentralController.php?timecode=Time&action=View_Detail_Timesheet&id=' + timesheetId,
            async: false
        })
            .done(function(data) {
                var table = $('<div/>').html(data).find('table');
                html = table;
            });
        return html;
    }

    Timesheet.prototype.isLoggedIn = function() {
        var _this = this;
        var result = true;
        chrome.cookies.getAll({url: this.opts.url, name: 'Loggedin'}, function(cookies) {
            if (cookies.length == 0) {
                $('#content').html('<a target="_blank" href="' + _this.opts.url + '">Click here</a> to login to HR first, then refresh this page.');
                result = false;
            }
        });

        return result;
    }

    Util = {
        get21LastMonth: function(d) {
            return moment(d).set('date', 21).subtract(1, 'months');
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
    }
})(jQuery);

document.addEventListener('DOMContentLoaded', function() {
    timesheet = new Timesheet();
});
