import React, { useRef, useMemo, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import PropTypes from 'prop-types';
import * as faceapi from 'face-api.js';

const DEFAULT_GLASSES = [
  { id: 1, left: '17.2%', top: '26%', startOffset: -240, width: 120 },
  { id: 2, left: '48.4%', top: '58%', startOffset: -240, width: 154 },
  { id: 3, left: '84.2%', top: '12%', startOffset: -240, width: 124 },
];

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

const loadFaceModels = async () => {
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
};

const Particle = ({ x, y, sectionRef }) => {
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'center center'] });
  const floatY = useTransform(scrollYProgress, [0, 1], [0, -18]);
  const springY = useSpring(floatY, { stiffness: 70, damping: 20 });

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 6,
        height: 6,
        borderRadius: 9999,
        background: 'rgba(255,255,255,0.08)',
        opacity: 0.85,
        y: springY,
        pointerEvents: 'none',
      }}
    />
  );
};

Particle.propTypes = { x: PropTypes.string.isRequired, y: PropTypes.string.isRequired, sectionRef: PropTypes.object };

const GlassItem = ({ glass, sectionRef, sunglassesSrc }) => {
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'center center'] });
  const yTransform = useTransform(scrollYProgress, [0, 0.65, 0.9, 1], [glass.startOffset, glass.startOffset * 0.44, glass.startOffset * 0.08, 0]);
  const springY = useSpring(yTransform, { stiffness: 160, damping: 20, mass: 0.75 });

  return (
    <div
      style={{
        position: 'absolute',
        left: glass.left,
        top: glass.top,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 3,
        display: 'block',
        width: 0,
        height: 0,
      }}
    >
      <motion.img
        src={sunglassesSrc}
        alt="sunglasses"
        draggable={false}
        style={{
          display: 'block',
          width: `${glass.width}px`,
          maxWidth: '100%',
          height: 'auto',
          y: springY,
          position: 'relative',
          transformOrigin: 'center center',
          willChange: 'transform',
          opacity: 1,
        }}
      />
    </div>
  );
};

GlassItem.propTypes = {
  glass: PropTypes.shape({
    id: PropTypes.number.isRequired,
    left: PropTypes.string.isRequired,
    top: PropTypes.string.isRequired,
    startOffset: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
  }).isRequired,
  sectionRef: PropTypes.object.isRequired,
  sunglassesSrc: PropTypes.string.isRequired,
};

const SunglassesLayer = ({ glasses, sectionRef, sunglassesSrc }) => (
  <>
    {glasses.map((glass) => (
      <GlassItem key={glass.id} glass={glass} sectionRef={sectionRef} sunglassesSrc={sunglassesSrc} />
    ))}
  </>
);

SunglassesLayer.propTypes = {
  glasses: PropTypes.array.isRequired,
  sectionRef: PropTypes.object.isRequired,
  sunglassesSrc: PropTypes.string.isRequired,
};

const TeamSection = ({ imageSrc, sunglassesSrc, glasses = DEFAULT_GLASSES, alt = 'Team image' }) => {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const [overlayGlasses, setOverlayGlasses] = useState(glasses);
  const [imageReady, setImageReady] = useState(false);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'center center'] });

  useEffect(() => {
    let cancelled = false;

    const runDetection = async () => {
      try {
        const detectionImage = new Image();
        detectionImage.crossOrigin = 'anonymous';
        detectionImage.src = imageSrc;

        await new Promise((resolve, reject) => {
          detectionImage.onload = resolve;
          detectionImage.onerror = reject;
        });

        if (cancelled) {
          return;
        }

        await loadFaceModels();

        if (cancelled) {
          return;
        }

        const detections = await faceapi.detectAllFaces(detectionImage, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
        if (cancelled) {
          return;
        }

        const orderedDetections = [...detections].sort((a, b) => {
          const aCenter = (a.landmarks.getLeftEye()[0].x + a.landmarks.getRightEye()[0].x) / 2;
          const bCenter = (b.landmarks.getLeftEye()[0].x + b.landmarks.getRightEye()[0].x) / 2;
          return aCenter - bCenter;
        });

        const width = detectionImage.naturalWidth || 1000;
        const height = detectionImage.naturalHeight || 600;

        const nextGlasses = orderedDetections.slice(0, 3).map((detection, index) => {
          const leftEye = detection.landmarks.getLeftEye();
          const rightEye = detection.landmarks.getRightEye();
          const leftEyePoint = leftEye.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
          const rightEyePoint = rightEye.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });

          const leftEyeCenter = {
            x: leftEyePoint.x / leftEye.length,
            y: leftEyePoint.y / leftEye.length,
          };
          const rightEyeCenter = {
            x: rightEyePoint.x / rightEye.length,
            y: rightEyePoint.y / rightEye.length,
          };

          const centerX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
          const centerY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
          const eyeDistance = Math.hypot(rightEyeCenter.x - leftEyeCenter.x, rightEyeCenter.y - leftEyeCenter.y);
          const computedWidth = Math.max(112, Math.min(220, Math.round(eyeDistance * 2.3)));

          return {
            id: index + 1,
            left: `${(centerX / width) * 100}%`,
            top: `${(centerY / height) * 100}%`,
            startOffset: -240,
            width: computedWidth,
          };
        });

        setOverlayGlasses(nextGlasses.length > 0 ? nextGlasses : glasses);
      } catch (error) {
        console.error('Unable to detect team faces automatically:', error);
        if (!cancelled) {
          setOverlayGlasses(glasses);
        }
      }
    };

    runDetection();

    return () => {
      cancelled = true;
    };
  }, [imageSrc, glasses]);

  const particles = useMemo(
    () => [
      { x: '12%', y: '18%' },
      { x: '27%', y: '42%' },
      { x: '43%', y: '28%' },
      { x: '59%', y: '52%' },
      { x: '76%', y: '22%' },
    ],
    [],
  );

  const textY = useTransform(scrollYProgress, [0, 0.2, 0.6], [30, 14, 0]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.25, 0.6], [0, 0.95, 1]);
  const textBlur = useTransform(scrollYProgress, [0, 0.35], [10, 0]);

  return (
    <section ref={sectionRef} style={{ position: 'relative', padding: '88px 0 120px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(12, 14, 18, 1) 0%, rgba(8, 10, 13, 1) 100%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: '10%', transform: 'translateX(-50%)', width: '64%', height: 420, borderRadius: '42%', filter: 'blur(68px)', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 52%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', left: '15%', top: '22%', width: 180, height: 180, borderRadius: '50%', filter: 'blur(40px)', background: 'rgba(15, 183, 255, 0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '12%', top: '24%', width: 160, height: 160, borderRadius: '50%', filter: 'blur(40px)', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        {particles.map((particle, index) => (
          <Particle key={index} x={particle.x} y={particle.y} sectionRef={sectionRef} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1220, margin: '0 auto', padding: '0 20px' }}>
        <motion.div style={{ marginBottom: 28, textAlign: 'center', y: textY, opacity: textOpacity, filter: textBlur }}>
          <p style={{ margin: 0, color: '#60a5fa', letterSpacing: '0.32em', textTransform: 'uppercase', fontSize: 12 }}>Meet The Team</p>
          <h2 style={{ margin: '16px auto 0', color: '#fff', fontSize: 42, maxWidth: 720, lineHeight: 1.05 }}>The engineers behind YQueue.</h2>
          <p style={{ marginTop: 16, color: '#cbd5e1', fontSize: 17, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Building the future of smart campus operations.
          </p>
        </motion.div>

        <div style={{ position: 'relative', borderRadius: 20, overflow: 'visible', boxShadow: '0 24px 90px rgba(0, 0, 0, 0.35)', width: '100%', maxWidth: 1000, margin: '0 auto' }}>
          <img
            ref={imageRef}
            src={imageSrc}
            alt={alt}
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 20, objectFit: 'cover', minHeight: 240 }}
            draggable={false}
          />

          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <SunglassesLayer glasses={overlayGlasses} sectionRef={sectionRef} sunglassesSrc={sunglassesSrc} />
          </div>
        </div>

        <motion.div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '18px 26px', borderRadius: 18, color: '#d8e3f0', maxWidth: 920 }}>
            <p style={{ margin: 0, textAlign: 'center', letterSpacing: '-0.01em', fontSize: 15 }}>
              A focused team delivering elegant, reliable systems for campus-scale operations.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

TeamSection.propTypes = {
  imageSrc: PropTypes.string.isRequired,
  sunglassesSrc: PropTypes.string.isRequired,
  glasses: PropTypes.array,
  alt: PropTypes.string,
};

export default TeamSection;
