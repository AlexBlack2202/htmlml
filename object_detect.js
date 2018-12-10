var netDet = undefined,
    netRecogn = undefined;
var persons = {};
var isRunning = false;

const FPS = 30; // Target number of frames processed per second.
//! [Run face detection model]
function detectFaces(img) {

    var faces = []
    return faces;
}

function face2vec(face) {
    var blob = cv.blobFromImage(face, 1.0 / 255, {
        width: 96,
        height: 96
    }, [0, 0, 0, 0], true, false)
    netRecogn.setInput(blob);
    var vec = netRecogn.forward();
    blob.delete();
    return vec;
};

function recognize(face) {
    var vec = face2vec(face);
    var bestMatchName = 'unknown';
    var bestMatchScore = 0.5;
    for (name in persons) {
        var personVec = persons[name];
        var score = vec.dot(personVec);
        if (score > bestMatchScore) {
            bestMatchScore = score;
            bestMatchName = name;
        }
    }
    vec.delete();
    return bestMatchName;
};

function main() {
    var output = document.getElementById('output');
    var camera = document.createElement("video");
    camera.setAttribute("width", output.width);
    camera.setAttribute("height", output.height);
    // Get a permission from user to use a camera.
    navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        })
        .then(function (stream) {
            camera.srcObject = stream;
            camera.onloadedmetadata = function (e) {
                camera.play();
            };
        });
    //! [Open a camera stream]
    var cap = new cv.VideoCapture(camera);
    var frame = new cv.Mat(camera.height, camera.width, cv.CV_8UC4);
    var frameBGR = new cv.Mat(camera.height, camera.width, cv.CV_8UC3);
    //! [Open a camera stream]
    //! [Add a person]

    //! [Add a person]
    //! [Define frames processing]
    
    
    
    //! [Define frames processing]
 
    document.getElementById('startStopButton').disabled = false;
};

function captureFrame() {
    var begin = Date.now();
    cap.read(frame); // Read a frame from camera
    cv.cvtColor(frame, frameBGR, cv.COLOR_RGBA2BGR);
    // var faces = detectFaces(frameBGR);
    // faces.forEach(function(rect) {
    //   cv.rectangle(frame, {x: rect.x, y: rect.y}, {x: rect.x + rect.width, y: rect.y + rect.height}, [0, 255, 0, 255]);
    //   var face = frameBGR.roi(rect);
    //   var name = recognize(face);
    //   cv.putText(frame, name, {x: rect.x, y: rect.y}, cv.FONT_HERSHEY_SIMPLEX, 1.0, [0, 255, 0, 255]);
    // });
    cv.imshow(output, frame);
    // Loop this function.
    if (isRunning) {
        var delay = 1000 / FPS - (Date.now() - begin);
        setTimeout(captureFrame, delay);
    }
};

document.getElementById('startStopButton').onclick = function toggle() {
    if (isRunning) {
        isRunning = false;
        document.getElementById('startStopButton').innerHTML = 'Start';
    } else {
        function run() {
            isRunning = true;
            captureFrame();
            document.getElementById('startStopButton').innerHTML = 'Stop';
            document.getElementById('startStopButton').disabled = false;
        }
        run();

    }
};