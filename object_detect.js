
var netDet = undefined, netRecogn = undefined;
var persons = {};
//! [Run face detection model]
function detectFaces(img) {
  var blob = cv.blobFromImage(img, 1, {width: 128, height: 96}, [104, 177, 123, 0], false, false);
  netDet.setInput(blob);
  var out = netDet.forward();
  var faces = [];
  for (var i = 0, n = out.data32F.length; i < n; i += 7) {
    var confidence = out.data32F[i + 2];
    var left = out.data32F[i + 3] * img.cols;
    var top = out.data32F[i + 4] * img.rows;
    var right = out.data32F[i + 5] * img.cols;
    var bottom = out.data32F[i + 6] * img.rows;
    left = Math.min(Math.max(0, left), img.cols - 1);
    right = Math.min(Math.max(0, right), img.cols - 1);
    bottom = Math.min(Math.max(0, bottom), img.rows - 1);
    top = Math.min(Math.max(0, top), img.rows - 1);
    if (confidence > 0.5 && left < right && top < bottom) {
      faces.push({x: left, y: top, width: right - left, height: bottom - top})
    }
  }
  blob.delete();
  out.delete();
  return faces;
};
//! [Run face detection model]
//! [Get 128 floating points feature vector]
function face2vec(face) {
  var blob = cv.blobFromImage(face, 1.0 / 255, {width: 96, height: 96}, [0, 0, 0, 0], true, false)
  netRecogn.setInput(blob);
  var vec = netRecogn.forward();
  blob.delete();
  return vec;
};
//! [Get 128 floating points feature vector]
//! [Recognize]
function recognize(face) {
  var vec = face2vec(face);
  var bestMatchName = 'unknown';
  var bestMatchScore = 0.5;  // Actually, the minimum is -1 but we use it as a threshold.
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
//! [Recognize]
function loadModels(callback) {
  var utils = new Utils('');
  var proto = 'https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt';
  var weights = 'https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20180205_fp16/res10_300x300_ssd_iter_140000_fp16.caffemodel';
  var recognModel = 'https://raw.githubusercontent.com/pyannote/pyannote-data/master/openface.nn4.small2.v1.t7';
  utils.createFileFromUrl('face_detector.prototxt', proto, () => {
    document.getElementById('status').innerHTML = 'Downloading face_detector.caffemodel';
    utils.createFileFromUrl('face_detector.caffemodel', weights, () => {
      document.getElementById('status').innerHTML = 'Downloading OpenFace model';
      utils.createFileFromUrl('face_recognition.t7', recognModel, () => {
        document.getElementById('status').innerHTML = '';
        netDet = cv.readNetFromCaffe('face_detector.prototxt', 'face_detector.caffemodel');
        netRecogn = cv.readNetFromTorch('face_recognition.t7');
        callback();
      });
    });
  });
};
function main() {
  // Create a camera object.
  var output = document.getElementById('output');
  var camera = document.createElement("video");
  camera.setAttribute("width", output.width);
  camera.setAttribute("height", output.height);
  // Get a permission from user to use a camera.
  navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(stream) {
      camera.srcObject = stream;
      camera.onloadedmetadata = function(e) {
        camera.play();
      };
  });
  //! [Open a camera stream]
  var cap = new cv.VideoCapture(camera);
  var frame = new cv.Mat(camera.height, camera.width, cv.CV_8UC4);
  var frameBGR = new cv.Mat(camera.height, camera.width, cv.CV_8UC3);
  //! [Open a camera stream]
  //! [Add a person]
  document.getElementById('addPersonButton').onclick = function() {
    var rects = detectFaces(frameBGR);
    if (rects.length > 0) {
      var face = frameBGR.roi(rects[0]);
      var name = prompt('Say your name:');
      var cell = document.getElementById("targetNames").insertCell(0);
      cell.innerHTML = name;
      persons[name] = face2vec(face).clone();
      var canvas = document.createElement("canvas");
      canvas.setAttribute("width", 96);
      canvas.setAttribute("height", 96);
      var cell = document.getElementById("targetImgs").insertCell(0);
      cell.appendChild(canvas);
      var faceResized = new cv.Mat(canvas.height, canvas.width, cv.CV_8UC3);
      cv.resize(face, faceResized, {width: canvas.width, height: canvas.height});
      cv.cvtColor(faceResized, faceResized, cv.COLOR_BGR2RGB);
      cv.imshow(canvas, faceResized);
      faceResized.delete();
    }
  };
  //! [Add a person]
  //! [Define frames processing]
  var isRunning = false;
  const FPS = 30;  // Target number of frames processed per second.
  function captureFrame() {
    var begin = Date.now();
    cap.read(frame);  // Read a frame from camera
    cv.cvtColor(frame, frameBGR, cv.COLOR_RGBA2BGR);
    var faces = detectFaces(frameBGR);
    faces.forEach(function(rect) {
      cv.rectangle(frame, {x: rect.x, y: rect.y}, {x: rect.x + rect.width, y: rect.y + rect.height}, [0, 255, 0, 255]);
      var face = frameBGR.roi(rect);
      var name = recognize(face);
      cv.putText(frame, name, {x: rect.x, y: rect.y}, cv.FONT_HERSHEY_SIMPLEX, 1.0, [0, 255, 0, 255]);
    });
    cv.imshow(output, frame);
    // Loop this function.
    if (isRunning) {
      var delay = 1000 / FPS - (Date.now() - begin);
      setTimeout(captureFrame, delay);
    }
  };
  //! [Define frames processing]
  document.getElementById('startStopButton').onclick = function toggle() {
    if (isRunning) {
      isRunning = false;
      document.getElementById('startStopButton').innerHTML = 'Start';
      document.getElementById('addPersonButton').disabled = true;
    } else {
      function run() {
        isRunning = true;
        captureFrame();
        document.getElementById('startStopButton').innerHTML = 'Stop';
        document.getElementById('startStopButton').disabled = false;
        document.getElementById('addPersonButton').disabled = false;
      }
      if (netDet == undefined || netRecogn == undefined) {
        document.getElementById('startStopButton').disabled = true;
        loadModels(run);  // Load models and run a pipeline;
      } else {
        run();
      }
    }
  };
  document.getElementById('startStopButton').disabled = false;
};