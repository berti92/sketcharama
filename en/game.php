<html>
<head>
  <script type="text/javascript">
  <?php
    error_reporting(0);
    if($_SERVER['REQUEST_METHOD'] === 'POST') {
      echo('var room = "'.$_POST['room_id'].'";');
      echo('var username = "'.$_POST['username'].'";');
      echo('var password = "'.$_POST['password'].'";');
      echo('var words = '.json_encode(str_replace("\r",'',$_POST['words'])).';');
    } else {
      echo('var room = "'.$_GET['room_id'].'";');
      echo('var username = "'.$_GET['username'].'";');
      echo('var password = "'.$_GET['password'].'";');
      echo('var words = '.json_encode(str_replace("\r",'',$_GET['words'])).';');
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
  <script   src="server/node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js"></script>
  <script   type="text/javascript" src="pub/locales/en.json"></script>
  <script   src="pub/application.js"></script>
  <meta property="og:title" content="Sketcharama - the free multiplayer browsergame"/>
  <meta property="og:description" content="The funny sketch game. Draw a given word and let your friends guess your sketch!"/>
  <meta property="og:type" content="game"/>
  <title>Sketcharama</title>
</head>
<body>
  <div id="body-container" class="dis-table full-width full-height">
    <div class="dis-table-row head">
      <span class="menu-button-area">
        <i onclick="$('#mnu_sidebar').toggleClass('sidebar-open');" class="fa fa-bars" aria-hidden="true"></i>
      </span>
      <span class="logo">Sketcharama</span>
      <span class="player-button-container">
        <span class="player-info-area">Room&nbsp;<span id="span_room"></span>&nbsp;Round&nbsp;(<span id="span_round"></span>)</span>
        <span id="round_id" style="display: none;"></span>
        <span class="player-button-area"><i onclick="$('#player_sidebar').toggleClass('sidebar-open');" class="fa fa-users player-button" aria-hidden="true"></i></span>
      </span>
    </div>
    <div class="dis-table-row body">
      <div class="body-container">
        <!-- sidebar menu -->
        <div id="mnu_sidebar" class="sidebar-left">
          <div class="sidebar-content">
            <div class="sidebar-head">Menu</div>
            <div class="sidebar-item"><a href="lobby.php">Lobby</a></div>
            <div class="sidebar-close"><i onclick="$('#mnu_sidebar').toggleClass('sidebar-open');" class="fa fa-arrow-left" aria-hidden="true"></i></div>
          </div>
        </div>
        <div class="paint-container">
          <div class="paint-table">
            <div class="dis-table-row paint-head">
              <div class="word-container">
                <div id="paint_word" class="word">_ _ _ _ _</div>
              </div>
              <div id="timer" class="time">90</div>
            </div>
            <div id="paint" class="dis-table-row paint-body">
              <?php include '_controlbox.php' ?>
              <canvas id="myCanvas"></canvas>
            </div>
            <div class="dis-table-row chat-container">
              <div class="chat-inner-container">
                <div class="chat-input-container"><input class="chat-input" type="text" placeholder="Chat and guess..." onkeydown="if (event.keyCode == 13) { submit_chat_message(); return false; }" /><a href="#" onclick="submit_chat_message();"><i class="fa fa-paper-plane-o chat-submit-button"></i></a></div>
                <div class="chat-body-container">
                  <div id="div_chat_content" style="overflow:scroll;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- sidebar player -->
        <div id="player_sidebar" class="sidebar-right">
          <div class="sidebar-content">
            <div class="sidebar-head">Players</div>
            <div class="sidebar-players">
              <div class="sidebar-item">Player 1<span id="points" class="badge">23</span><span class="badge"><i class="fa fa-paint-brush" aria-hidden="true"></i></span></div>
              <div class="sidebar-item">Player 2</div>
              <div class="sidebar-item">Player 3</div>
            </div>
            <div class="sidebar-close"><i onclick="$('#player_sidebar').toggleClass('sidebar-open');" class="fa fa-arrow-right" aria-hidden="true"></i></div>
          </div>
        </div>
      </div>
    </div>
    <div class="dis-table-row foot"></div>
  </div>
  <div id="password_modal" class="modal-container">
    <div class="inner-head">
      Password needed
      <a href="#" onclick="openModal('password_modal');" class="btn" style="float:right; background-color: #F62459;">X</a>
    </div>
    <div class="form-box">
      <label class="info">Please type in the password for this room:</label>
      <input type="text" id="txt_password" name="password" placeholder="Password..." />
      <div class="link-bar" style="margin-left: 0px;">
        <a class="btn" href="#" onclick="submit_join_password(room);">Join room</a>
      </div>
    </div>
  </div>
</body>
</html>
