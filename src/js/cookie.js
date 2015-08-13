$(document).ready(function () {
	$('body').on('click' ,'.mark-as-full',function(){
		var cookies = document.cookie;
		cookies = cookies.split('; ');
		var theDate = $(this).attr('data') + '=';
		var exist = false;

        for (var i = 0; i < cookies.length; i++) {
           	if (theDate == cookies[i]) {
            	exist = true;
            	break;
           	}
        }

        if (exist == false) {
        	document.cookie = theDate + '; expires=Thu, 07 Sep 2094 00:00:00 GMT';
			location.reload();
        } else {
        	document.cookie = theDate + '; expires=Thu, 07 Sep 1994 00:00:00 GMT';
			location.reload();
        }
	});
});