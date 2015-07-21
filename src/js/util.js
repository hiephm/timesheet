var Util = null;

(function($, undefined) {
    Util = {
        get21LastMonth: function(d) {
            var date = moment(d).set('date', 21).subtract(1, 'months');
            return date.day() == 0 ? date.add(1, 'days') : date;
        },

        get21ThisMonth: function(d) {
            return moment(d).set('date', 21);
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
        },

        getLast12Months: function() {
            var now = Util.getCurrentMonth();
            var list = [];
            for (var i = 0; i < 12; i++) {
                list.push(moment(now).date(1).subtract(i, 'months'));
            }

            return list;
        },

        getCurrentMonth: function() {
            var now = moment();
            var cutOverDay = moment().date(20);
            return now.isAfter(cutOverDay) ? now.add(1, 'months') : now;
        },

        showLoader: function() {
            $('#timesheet').html('<div style="text-align: center"><img src="images/ajax-loader.gif"/></div>');
        }
    };
})(jQuery);