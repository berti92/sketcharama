<div id="control_paint" class="box-group">
  <a class="btn" onclick="$('.box-group').toggleClass('box-open');"><i style="line-height: 40px; font-size: 24px;" class="fa fa-paint-brush" aria-hidden="true"></i></a>
  <div class="box-expand-area">
    <div class="colorbox initcolor"><span class="colorbox-inner" style="background-color: black;">&nbsp;</span></div>
    <div class="colorbox"><span class="colorbox-inner" style="background-color: grey;">&nbsp;</span></div>
    <div class="colorbox"><span class="colorbox-inner" style="background-color: white;">&nbsp;</span></div>
    <div class="colorbox"><span class="colorbox-inner" style="background-color: green;">&nbsp;</span></div>
    <div class="colorbox"><span class="colorbox-inner" style="background-color: yellow;">&nbsp;</span></div>
    <div class="colorbox"><span class="colorbox-inner" style="background-color: orange;">&nbsp;</span></div>
    <div class="colorbox"><span class="colorbox-inner" style="background-color: red;">&nbsp;</span></div>
    <div class="colorbox"><span class="colorbox-inner" style="background-color: brown;">&nbsp;</span></div>
    <div class="colorbox"><span class="colorbox-inner" style="background-color: blue;">&nbsp;</span></div>
    <div class="colorbox"><span class="colorbox-inner" style="background-color: purple;">&nbsp;</span></div>
    <hr>
    <div class="sizecontainer">
      <label>Größe:</label>
      <select id="selWidth">
        <option value="3">3</option>
        <option value="5">5</option>
        <option value="7">7</option>
        <option value="9">9</option>
        <option value="12">12</option>
        <option value="15">15</option>
        <option value="20">20</option>
        <option value="25">25</option>
        <option value="100">100</option>
        <option value="500">500</option>
      </select>
    </div>
    <hr>
    <div onclick="clearArea(true);" class="rect-btn" style="float: left;"><i class="fa fa-eraser" aria-hidden="true"></i></div>&nbsp;&nbsp;<div onclick="skipTurn();" class="rect-btn alert-btn" style="float: right;"><i class="fa fa-times-circle" aria-hidden="true"></i></div>
  </div>
</div>
<input type="hidden" name="color" value="000">
<input type="hidden" name="size" value="000">
<script type="text/javascript">
  $(function() {
    $('.colorbox').on('click', function(e) {
      $('.colorbox').removeClass('active-color');
      $(this).addClass('active-color');
      $('[name="color"]').val();
    });
  });
</script>
