var canvas = document.getElementById('canvas');
var sig = $('#sig');
var context = canvas.getContext('2d');
var coordX = [];
var coordY = [];
var startX;
var startY;
var drawing;


canvas.addEventListener('mousedown', function(e) {
    startX = e.offsetX;
    startY = e.offsetY;
    drawing = true;
});

canvas.addEventListener('mousemove', function(e) {
    if (drawing) {
        coordX.push(e.offsetX);
        coordY.push(e.offsetY);
        draw();
    }
});

canvas.addEventListener('mouseup', function(e) {
    drawing = false;
    coordX = [];
    coordY = [];
    startX = null;
    startY = null;
    sig.val(canvas.toDataURL());
});

function draw(mousemove) {
    context.lineJoin = 'round';
    context.lineWidth = 1;
    for (var i = 0; i < coordX.length; i++) {
        context.beginPath();
        context.moveTo(coordX[i-1], coordY[i-1]);
        context.lineTo(coordX[i], coordY[i]);
        context.stroke();
    }
}
