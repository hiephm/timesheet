var Util = null;

(function($, undefined) {
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
})(jQuery);