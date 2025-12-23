/*************************************************
 * REAL-TIME POSE DETECTION (FINAL VERSION)
 * MediaPipe Holistic + JS
 *************************************************/

// ---------- HTML ELEMENTS ----------
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const output = document.getElementById("output");

// ---------- MOBILE OPTIMIZATION ----------
const isMobile = window.innerWidth < 768;

// ---------- VOICE CONTROL ----------
let lastSpoken = "";

// ---------- SPEAK ----------
function speak(text) {
  if (!text || text === lastSpoken) return;
  lastSpoken = text;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

// ---------- LOAD MEDIAPIPE ----------
const holistic = new Holistic({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
});

holistic.setOptions({
  modelComplexity: isMobile ? 0 : 1,
  smoothLandmarks: true,
});

// ---------- ANGLE CALCULATION ----------
function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// ---------- SMOOTHING ----------
let angleHistory = {};
function smooth(key, value) {
  if (!angleHistory[key]) angleHistory[key] = [];
  angleHistory[key].push(value);
  if (angleHistory[key].length > 5) angleHistory[key].shift();
  return (
    angleHistory[key].reduce((a, b) => a + b, 0) /
    angleHistory[key].length
  );
}

// ---------- ACCURACY ----------
function accuracy(current, ideal) {
  return Math.max(0, Math.round(100 - Math.abs(current - ideal) * 1.5));
}

// ---------- SAVE SESSION ----------
function saveSession(pose, acc) {
  const sessions = JSON.parse(localStorage.getItem("poseSessions")) || [];
  sessions.push({
    pose,
    accuracy: acc,
    time: new Date().toLocaleString(),
  });
  localStorage.setItem("poseSessions", JSON.stringify(sessions));
}

// ---------- DRAW SKELETON ----------
const connections = [
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [11, 12],
  [11, 23], [12, 24],
  [23, 25], [25, 27],
  [24, 26], [26, 28],
];

function drawSkeleton(lm) {
  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;
  connections.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
    ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
    ctx.stroke();
  });
}

// ---------- DRAW TEXT ----------
function drawText(text, x, y) {
  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.fillText(text, x, y);
}

// ---------- POSE DETECTION ----------
function detectPose(lm) {
  let pose = "No Pose";
  let acc = 0;
  let message = "Adjust posture";

  // Angles
  const leftArm = smooth(
    "lArm",
    calculateAngle(lm[11], lm[13], lm[15])
  );
  const rightArm = smooth(
    "rArm",
    calculateAngle(lm[12], lm[14], lm[16])
  );
  const leftKnee = smooth(
    "lKnee",
    calculateAngle(lm[23], lm[25], lm[27])
  );
  const rightKnee = smooth(
    "rKnee",
    calculateAngle(lm[24], lm[26], lm[28])
  );

  // ---------- LIVE ANGLES ----------
  drawText(`Left Arm: ${leftArm.toFixed(1)}°`, 10, 20);
  drawText(`Right Arm: ${rightArm.toFixed(1)}°`, 10, 40);
  drawText(`Left Knee: ${leftKnee.toFixed(1)}°`, 10, 60);
  drawText(`Right Knee: ${rightKnee.toFixed(1)}°`, 10, 80);

  // ---------- T-POSE ----------
  if (leftArm > 140 && rightArm > 140) {
    pose = "🧍 T-Pose";
    acc = Math.min(accuracy(leftArm, 180), accuracy(rightArm, 180));
    message = acc > 75 ? "Perfect T pose" : "Straighten your arms";
  }

  // ---------- WARRIOR II ----------
  else if (
    (leftKnee > 70 && leftKnee < 130) ||
    (rightKnee > 70 && rightKnee < 130)
  ) {
    pose = "⚔️ Warrior II";
    acc = Math.max(accuracy(leftKnee, 90), accuracy(rightKnee, 90));
    message = acc > 75 ? "Strong warrior pose" : "Bend your front knee";
  }

  // ---------- TREE POSE ----------
  else {
    const ankleDiff = Math.abs(lm[27].y - lm[28].y);
    if (ankleDiff > 0.12) {
      pose = "🌳 Tree Pose";
      acc = accuracy(ankleDiff * 100, 18);
      message = acc > 75 ? "Good balance" : "Focus on balance";
    }
  }

  output.innerText = `${pose} | Accuracy: ${acc}%`;
  speak(message);

  if (acc > 80) saveSession(pose, acc);
}

// ---------- PROCESS FRAMES ----------
holistic.onResults((results) => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    results.poseLandmarks.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    });

    drawSkeleton(results.poseLandmarks);
    detectPose(results.poseLandmarks);
  } else {
    output.innerText = "No person detected";
  }
});

// ---------- CAMERA ----------
const camera = new Camera(video, {
  onFrame: async () => {
    await holistic.send({ image: video });
  },
  width: isMobile ? 360 : 640,
  height: isMobile ? 480 : 480,
});

camera.start();
