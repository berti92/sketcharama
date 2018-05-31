<html>
<head>
  <script type="text/javascript">
  <?php
    error_reporting(0);
    if($_SERVER['REQUEST_METHOD'] === 'POST') {
      echo('var room = "'.$_POST['room_id'].'";');
    } else {
      echo('var room = "'.$_GET['room_id'].'";');
    }
  ?>
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <link rel="shortcut icon" type="image/x-icon" href="/pub/favicon.ico">
  <link href="/pub/fonts/fonts.css" rel="stylesheet">
  <link href="/pub/font-awesome/css/font-awesome.min.css" rel="stylesheet">
  <link href="/pub/application.css" rel="stylesheet">
  <link     href="/pub/sweetalert.min.css" rel="stylesheet">
  <script src="/pub/jquery.min.js"></script>
  <script   src="/pub/sweetalert.min.js"></script>
  <script   src="server/node_modules/socket.io/node_modules/socket.io-client/socket.io.js"></script>
  <meta property="og:title" content="Sketcharama - the free multiplayer browsergame"/>
  <meta property="og:description" content="The funny sketch game. Draw a given word and let your friends guess your sketch!"/>
  <meta property="og:type" content="website"/>
  <title>Sketcharama</title>
</head>
<body>
  <div id="body-container" class="dis-table full-width full-height">
    <div class="dis-table-row head">
      <span class="logo" style="margin-left: 20px;">Sketcharama</span>
    </div>
    <div class="dis-table-row body-lobby">
      <div class="body-container">
        <!-- sidebar menu -->
        <div class="lobby-container">
          <form action="game.php" method="POST">
            <div class="lobby-box">
              <div class="lobby-head">Lobby</div>
              <div class="form-box">
                <label id="label-shared-link" class="info" style="display: none;">You opened a shared link, please type in your username. The right room is already selected.<br/></label>
                <label class="info">Type in your name:</label>
                <input type="text" name="username" placeholder="Username..."/>
              </div>
              <input type="hidden" name="room_id" value="" />
              <div class="room-box">
                <div class="inner-head">Rooms</div>
                <div class="room-body">
                </div>
              </div>
              <div class="link-bar">
                <a class="btn submit" href="#" title="Join the selected room">Join</a>
                <a class="btn" onclick="openModal();" href="#" title="Create private room">Create</a>
                <a class="btn" onclick="refresh_rooms();" href="#" title="Refresh"><i class="fa fa-refresh" aria-hidden="true"></i></a>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px;"><a style="color: #ffffff;" href="http://www.devbert.de/index.php/en/home/" target="_blank">Made by Devbert</a></div>
            <div class="modal-container">
              <div class="inner-head">
                Create private room
                <a href="#" onclick="closeModal();" class="btn" style="float:right; background-color: #F62459;">X</a>
              </div>
              <div class="form-box">
                <label class="info">Type in a password to create a private room::</label>
                <input type="text" name="password" placeholder="Password..." disabled />
                <label class="info">Type in words you want to play (One word per line. If no word is given then the standard list will be used):</label>
                <textarea name="words" placeholder="Words..."></textarea>
                <div class="link-bar" style="margin-left: 0px;">
                  <a class="btn submit-pw" href="#">Create a private room</a>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div class="dis-table-row foot"></div>
  </div>
  <script type="text/javascript">
    function openModal() {
      $('.modal-container').toggleClass('modal-open');
      $('.lobby-box').toggleClass('is-blurred');
      $('[name="password"]').prop('disabled', function(i, v) { return !v; });
    }
    function closeModal() {
      openModal();
      $('[name="password"]').val('');
    }
    function display_rooms(rooms) {
    	var html = "";
      $('.room').remove();
    	html +=  "<div class='div_rooms'>";
    	for (var i = 0; i < rooms.length; i++) {
    		var current_room = rooms[i];
        html += '<div id="room'+current_room['name']+'" class="room">';
        html += '<div class="room-id">'+current_room['name']+'</div>';
        html += '<div class="room-players">'+current_room['player-count'].toString()+" / "+current_room['max-players'].toString()+'</div>'
        html += '<div class="room-private">'+(current_room['password'] === true ? '<i class="fa fa-lock fa-1" aria-hidden="true"></i>' : '')+'</div>'
        html += '</div>';
    	}
    	html += "</div>";
    	$(".room-body").html(html);
      register_click();
    }
    function refresh_rooms() {
      socket.emit('get_rooms',1);
    }
    function register_click() {
      $('.room').on('click', function(e) {
        select_room(this);
      });
    }
    function select_room(room_dom) {
      $('[name="room_id"]').val($(room_dom).find('.room-id').html());
      $('.room').removeClass('active');
      $(room_dom).addClass('active');
    }
    $(function() {
      socket = io(location.protocol + "//" + location.hostname+':8001');
      socket.on('rooms', function(msg){
    		display_rooms(msg);
        if(room !== '') {
          select_room('#room'+room);
          $('.room-body').animate({
            scrollTop: $('#room'+room).offset().top - $('.room-body').offset().top
          }, 200);
          $('#label-shared-link').fadeIn();
        }
    	});
      refresh_rooms();
      $('.submit').on('click', function(e) {
        if($('[name="room_id"]').val() === '') {
          sweetAlert({
              text: 'Please select a room!',
              title: 'Select a room',
              type: "error",
          });
        } else {
          $(this).closest('form').submit();
        }
      });
      $('.submit-pw').on('click', function(e) {
        if($('[name="password"]').val() === '') {
          sweetAlert({
              text: 'Please type in the password for the private room!',
              title: 'Password missing',
              type: "error",
          });
        } else {
          $(this).closest('form').submit();
        }
      });
    });
  </script>
</body>
</html>
