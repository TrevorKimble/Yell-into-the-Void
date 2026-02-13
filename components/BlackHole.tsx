'use client';

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

interface TextParticle {
  char: string;
  x: number;
  y: number;
  angle: number;
  radius: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotation_speed: number;
  font_size: number;
  original_font_size: number;
  hue: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  angle: number;
  distance: number;
  speed: number;
  brightness: number;
  color: number;
  layer: number;
}

interface BackgroundStar {
  x: number;
  y: number;
  radius: number;
  brightness: number;
  color: string;
  twinkle_offset: number;
  twinkle_speed: number;
}

interface StarCluster {
  cx: number;
  cy: number;
  stars: { x: number; y: number; radius: number; brightness: number; color: string }[];
}

interface DustCloud {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  color: string;
  drift_x: number;
  drift_y: number;
}

interface AccretionParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  brightness: number;
  color_offset: number;
}

interface DebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface Comet {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  tail_length: number;
}

interface Galaxy {
  x: number;
  y: number;
  rotation: number;
  size: number;
  opacity: number;
  arms: number;
  tilt: number;
  hue: number;
  rotation_speed: number;
}

export interface BlackHoleHandle {
  yell: (text: string) => void;
}

interface BlackHoleProps {
  on_animation_done?: () => void;
}

// Realistic star colors based on spectral type
const STAR_COLORS = [
  'rgba(155, 176, 255, ALPHA)', // O-type: blue
  'rgba(170, 191, 255, ALPHA)', // B-type: blue-white
  'rgba(202, 215, 255, ALPHA)', // A-type: white
  'rgba(248, 247, 255, ALPHA)', // F-type: yellow-white
  'rgba(255, 244, 234, ALPHA)', // G-type: yellow (sun-like)
  'rgba(255, 210, 161, ALPHA)', // K-type: orange
  'rgba(255, 204, 111, ALPHA)', // K-type: deep orange
  'rgba(255, 183, 108, ALPHA)', // M-type: red-orange
  'rgba(255, 160, 120, ALPHA)', // M-type: red
];

function get_star_color(color_index: number, alpha: number): string {
  const idx = Math.min(Math.floor(color_index * STAR_COLORS.length), STAR_COLORS.length - 1);
  return STAR_COLORS[idx].replace('ALPHA', alpha.toFixed(3));
}

const BlackHole = forwardRef<BlackHoleHandle, BlackHoleProps>(function BlackHole({ on_animation_done }, ref) {
  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const animation_ref = useRef<number>(0);
  const stars_ref = useRef<Star[]>([]);
  const bg_stars_ref = useRef<BackgroundStar[]>([]);
  const clusters_ref = useRef<StarCluster[]>([]);
  const dust_ref = useRef<DustCloud[]>([]);
  const accretion_ref = useRef<AccretionParticle[]>([]);
  const text_particles_ref = useRef<TextParticle[]>([]);
  const debris_ref = useRef<DebrisParticle[]>([]);
  const comets_ref = useRef<Comet[]>([]);
  const galaxies_ref = useRef<Galaxy[]>([]);
  const time_ref = useRef<number>(0);
  const center_ref = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pulse_ref = useRef<number>(0);
  const on_animation_done_ref = useRef(on_animation_done);
  on_animation_done_ref.current = on_animation_done;
  const had_text_particles_ref = useRef<boolean>(false);
  // Pre-rendered milky way canvas for performance
  const milky_way_canvas_ref = useRef<HTMLCanvasElement | null>(null);

  const init_background_stars = useCallback((width: number, height: number) => {
    const stars: BackgroundStar[] = [];
    // Dense static star field — 2000+ tiny stars that don't orbit
    const count = Math.floor((width * height) / 800);
    for (let i = 0; i < count; i++) {
      const color_val = Math.random();
      // Weight toward dimmer, redder stars (more realistic)
      const weighted_color = Math.pow(color_val, 0.6);
      const brightness = 0.15 + Math.pow(Math.random(), 2) * 0.85;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.3 + Math.pow(Math.random(), 3) * 1.5,
        brightness,
        color: get_star_color(weighted_color, brightness),
        twinkle_offset: Math.random() * Math.PI * 2,
        twinkle_speed: 0.5 + Math.random() * 2,
      });
    }
    bg_stars_ref.current = stars;
  }, []);

  const init_stars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    const cx = width / 2;
    const cy = height / 2;
    const max_dist = Math.max(width, height);

    // Far layer — many tiny dim stars
    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 120 + Math.random() * max_dist * 0.7;
      stars.push({
        x: cx + Math.cos(angle) * distance,
        y: cy + Math.sin(angle) * distance,
        radius: 0.3 + Math.random() * 0.8,
        angle,
        distance,
        speed: 0.00005 + Math.random() * 0.00015,
        brightness: 0.2 + Math.random() * 0.5,
        color: Math.random(),
        layer: 0,
      });
    }

    // Mid layer — moderate stars
    for (let i = 0; i < 300; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * max_dist * 0.5;
      stars.push({
        x: cx + Math.cos(angle) * distance,
        y: cy + Math.sin(angle) * distance,
        radius: 0.5 + Math.random() * 1.3,
        angle,
        distance,
        speed: 0.0001 + Math.random() * 0.0003,
        brightness: 0.3 + Math.random() * 0.7,
        color: Math.random(),
        layer: 1,
      });
    }

    // Near layer — fewer bright prominent stars
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * max_dist * 0.6;
      stars.push({
        x: cx + Math.cos(angle) * distance,
        y: cy + Math.sin(angle) * distance,
        radius: 1.0 + Math.random() * 2.0,
        angle,
        distance,
        speed: 0.0002 + Math.random() * 0.0005,
        brightness: 0.5 + Math.random() * 0.5,
        color: Math.random(),
        layer: 2,
      });
    }

    stars_ref.current = stars;
  }, []);

  const init_star_clusters = useCallback((width: number, height: number) => {
    const clusters: StarCluster[] = [];
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const cluster_cx = Math.random() * width;
      const cluster_cy = Math.random() * height;
      const cluster_size = 30 + Math.random() * 80;
      const star_count = 20 + Math.floor(Math.random() * 40);
      const cluster_stars = [];
      for (let j = 0; j < star_count; j++) {
        // Gaussian-ish distribution around center
        const r = Math.pow(Math.random(), 0.5) * cluster_size;
        const a = Math.random() * Math.PI * 2;
        const color_val = Math.pow(Math.random(), 0.5);
        const brightness = 0.3 + Math.random() * 0.7;
        cluster_stars.push({
          x: cluster_cx + Math.cos(a) * r,
          y: cluster_cy + Math.sin(a) * r,
          radius: 0.3 + Math.pow(Math.random(), 2) * 1.2,
          brightness,
          color: get_star_color(color_val, brightness),
        });
      }
      clusters.push({ cx: cluster_cx, cy: cluster_cy, stars: cluster_stars });
    }
    clusters_ref.current = clusters;
  }, []);

  const init_dust_clouds = useCallback((width: number, height: number) => {
    const clouds: DustCloud[] = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 100 + Math.random() * 300,
        opacity: 0.02 + Math.random() * 0.04,
        color: Math.random() < 0.4
          ? `rgba(20, 10, 40, ALPHA)` // dark dust
          : Math.random() < 0.5
            ? `rgba(80, 40, 120, ALPHA)` // purple nebula
            : `rgba(40, 60, 120, ALPHA)`, // blue nebula
        drift_x: (Math.random() - 0.5) * 0.1,
        drift_y: (Math.random() - 0.5) * 0.1,
      });
    }
    dust_ref.current = clouds;
  }, []);

  const init_milky_way = useCallback((width: number, height: number) => {
    // Pre-render the Milky Way band onto an offscreen canvas
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    const octx = off.getContext('2d');
    if (!octx) return;

    // Main galactic band — a diagonal stripe of dense stars and glow
    const band_angle = -0.3; // slight tilt
    const band_width = height * 0.35;

    octx.save();
    octx.translate(width / 2, height / 2);
    octx.rotate(band_angle);

    // Soft glow layers for the band
    for (let layer = 0; layer < 4; layer++) {
      const w = band_width * (1 + layer * 0.5);
      const grad = octx.createLinearGradient(0, -w / 2, 0, w / 2);
      const alpha = [0.035, 0.025, 0.015, 0.008][layer];
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.2, `rgba(180, 160, 220, ${alpha})`);
      grad.addColorStop(0.35, `rgba(200, 180, 240, ${alpha * 1.5})`);
      grad.addColorStop(0.5, `rgba(220, 200, 255, ${alpha * 2})`);
      grad.addColorStop(0.65, `rgba(200, 180, 240, ${alpha * 1.5})`);
      grad.addColorStop(0.8, `rgba(180, 160, 220, ${alpha})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      octx.fillStyle = grad;
      octx.fillRect(-width, -w / 2, width * 2, w);
    }

    // Dense tiny stars along the band
    const band_star_count = Math.floor(width * 1.5);
    for (let i = 0; i < band_star_count; i++) {
      const sx = (Math.random() - 0.5) * width * 1.5;
      // Gaussian-ish Y within the band
      const sy = (Math.random() + Math.random() + Math.random() - 1.5) * band_width * 0.4;
      const sr = 0.2 + Math.pow(Math.random(), 3) * 1.0;
      const alpha = 0.1 + Math.pow(Math.random(), 2) * 0.6;
      const color_val = Math.pow(Math.random(), 0.5);
      octx.beginPath();
      octx.arc(sx, sy, sr, 0, Math.PI * 2);
      octx.fillStyle = get_star_color(color_val, alpha);
      octx.fill();
    }

    // Add some brighter knots and patches within the band
    for (let i = 0; i < 12; i++) {
      const kx = (Math.random() - 0.5) * width * 1.2;
      const ky = (Math.random() - 0.5) * band_width * 0.3;
      const kr = 15 + Math.random() * 40;
      const grad = octx.createRadialGradient(kx, ky, 0, kx, ky, kr);
      const hue = Math.random() < 0.3 ? '200, 180, 240' : Math.random() < 0.5 ? '240, 200, 220' : '180, 200, 255';
      grad.addColorStop(0, `rgba(${hue}, ${0.04 + Math.random() * 0.04})`);
      grad.addColorStop(1, `rgba(${hue}, 0)`);
      octx.fillStyle = grad;
      octx.fillRect(kx - kr, ky - kr, kr * 2, kr * 2);

      // Extra stars in knots
      for (let j = 0; j < 15; j++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.5) * kr;
        const brightness = 0.2 + Math.random() * 0.5;
        octx.beginPath();
        octx.arc(kx + Math.cos(a) * r, ky + Math.sin(a) * r, 0.3 + Math.random() * 0.6, 0, Math.PI * 2);
        octx.fillStyle = get_star_color(Math.random(), brightness);
        octx.fill();
      }
    }

    // Dark dust lanes cutting through the band
    for (let i = 0; i < 5; i++) {
      const dx = (Math.random() - 0.5) * width * 1.2;
      const dy = (Math.random() - 0.5) * band_width * 0.15;
      const dw = 80 + Math.random() * 200;
      const dh = 8 + Math.random() * 20;
      const dgrad = octx.createRadialGradient(dx, dy, 0, dx, dy, dw / 2);
      dgrad.addColorStop(0, 'rgba(5, 5, 16, 0.3)');
      dgrad.addColorStop(0.6, 'rgba(5, 5, 16, 0.15)');
      dgrad.addColorStop(1, 'rgba(5, 5, 16, 0)');
      octx.fillStyle = dgrad;
      octx.fillRect(dx - dw / 2, dy - dh / 2, dw, dh);
    }

    octx.restore();
    milky_way_canvas_ref.current = off;
  }, []);

  const init_accretion = useCallback(() => {
    const particles: AccretionParticle[] = [];
    for (let i = 0; i < 400; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 80 + Math.random() * 180,
        speed: 0.008 + Math.random() * 0.016,
        size: Math.random() * 2.5 + 0.5,
        brightness: 0.4 + Math.random() * 0.6,
        color_offset: Math.random(),
      });
    }
    accretion_ref.current = particles;
  }, []);

  const init_galaxies = useCallback((width: number, height: number) => {
    const galaxies: Galaxy[] = [];
    for (let i = 0; i < 5; i++) {
      galaxies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        rotation: Math.random() * Math.PI * 2,
        size: 40 + Math.random() * 100,
        opacity: 0.08 + Math.random() * 0.15,
        arms: 2 + Math.floor(Math.random() * 3),
        tilt: 0.2 + Math.random() * 0.6,
        hue: Math.random() * 60 + 200, // blue-purple range
        rotation_speed: (Math.random() - 0.5) * 0.0003,
      });
    }
    galaxies_ref.current = galaxies;
  }, []);

  const spawn_comet = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(center_ref.current.x, center_ref.current.y) * 1.2;
    comets_ref.current.push({
      angle,
      distance,
      speed: 2 + Math.random() * 3,
      size: 2 + Math.random() * 3,
      tail_length: 40 + Math.random() * 60,
    });
  }, []);

  const spawn_text_particles = useCallback((text: string) => {
    const cx = center_ref.current.x;
    const cy = center_ref.current.y;
    const chars = text.split('');
    const new_particles: TextParticle[] = [];

    const start_y = 180;
    const char_width = 18;
    const max_chars_per_line = Math.floor((cx * 1.4) / char_width);
    let line = 0;
    let col = 0;

    const effect_type = Math.floor(Math.random() * 4);

    chars.forEach((char) => {
      if (col >= max_chars_per_line) {
        line++;
        col = 0;
      }

      const chars_on_this_line = Math.min(chars.length - line * max_chars_per_line, max_chars_per_line);
      const line_start_x = cx - (chars_on_this_line * char_width) / 2;
      const x = line_start_x + col * char_width;
      const y = start_y + line * 28;
      const dx = x - cx;
      const dy = y - cy;
      const angle = Math.atan2(dy, dx);
      const radius = Math.sqrt(dx * dx + dy * dy);

      let hue = 270;
      if (effect_type === 1) hue = 15;
      else if (effect_type === 2) hue = 200;
      else if (effect_type === 3) hue = 50;

      new_particles.push({
        char,
        x,
        y,
        angle,
        radius,
        speed: 0.4 + Math.random() * 0.4,
        opacity: 1,
        rotation: 0,
        rotation_speed: (Math.random() - 0.5) * 0.08,
        font_size: 20,
        original_font_size: 20,
        hue,
      });

      col++;
    });

    text_particles_ref.current = [...text_particles_ref.current, ...new_particles];
    had_text_particles_ref.current = true;

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      debris_ref.current.push({
        x: cx,
        y: start_y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        opacity: 0.6,
        color: `hsl(${new_particles[0]?.hue || 270}, 70%, 60%)`,
      });
    }
  }, []);

  useImperativeHandle(ref, () => ({
    yell: (text: string) => {
      spawn_text_particles(text);
      pulse_ref.current = 1;
    },
  }), [spawn_text_particles]);

  useEffect(() => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      center_ref.current = { x: canvas.width / 2, y: canvas.height / 2 };
      init_background_stars(canvas.width, canvas.height);
      init_stars(canvas.width, canvas.height);
      init_star_clusters(canvas.width, canvas.height);
      init_dust_clouds(canvas.width, canvas.height);
      init_milky_way(canvas.width, canvas.height);
      init_galaxies(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const comet_interval = setInterval(() => {
      if (Math.random() < 0.3) spawn_comet();
    }, 4000);

    const draw = () => {
      time_ref.current += 0.016;
      const t = time_ref.current;
      const cx = center_ref.current.x;
      const cy = center_ref.current.y;

      pulse_ref.current *= 0.95;

      // Clear with deep space color
      ctx.fillStyle = '#030308';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Very subtle overall space gradient — slight warm center fade
      const space_grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(canvas.width, canvas.height) * 0.7);
      space_grad.addColorStop(0, 'rgba(15, 8, 25, 0.3)');
      space_grad.addColorStop(0.5, 'rgba(8, 5, 18, 0.1)');
      space_grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = space_grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Milky Way band (pre-rendered)
      if (milky_way_canvas_ref.current) {
        ctx.globalAlpha = 0.9 + 0.1 * Math.sin(t * 0.2);
        ctx.drawImage(milky_way_canvas_ref.current, 0, 0);
        ctx.globalAlpha = 1;
      }

      // Draw dust clouds — drifting dark and colored patches
      dust_ref.current.forEach((cloud) => {
        cloud.x += cloud.drift_x;
        cloud.y += cloud.drift_y;
        // Wrap around
        if (cloud.x < -cloud.radius) cloud.x = canvas.width + cloud.radius;
        if (cloud.x > canvas.width + cloud.radius) cloud.x = -cloud.radius;
        if (cloud.y < -cloud.radius) cloud.y = canvas.height + cloud.radius;
        if (cloud.y > canvas.height + cloud.radius) cloud.y = -cloud.radius;

        const grad = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
        grad.addColorStop(0, cloud.color.replace('ALPHA', (cloud.opacity * 1.5).toFixed(3)));
        grad.addColorStop(0.5, cloud.color.replace('ALPHA', cloud.opacity.toFixed(3)));
        grad.addColorStop(1, cloud.color.replace('ALPHA', '0'));
        ctx.fillStyle = grad;
        ctx.fillRect(cloud.x - cloud.radius, cloud.y - cloud.radius, cloud.radius * 2, cloud.radius * 2);
      });

      // Draw background galaxies (distant)
      galaxies_ref.current.forEach((galaxy) => {
        galaxy.rotation += galaxy.rotation_speed;

        ctx.save();
        ctx.translate(galaxy.x, galaxy.y);
        ctx.rotate(galaxy.rotation);

        // Galaxy core glow
        const core_grad = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.size * 0.3);
        core_grad.addColorStop(0, `hsla(${galaxy.hue}, 40%, 80%, ${galaxy.opacity * 0.6})`);
        core_grad.addColorStop(0.5, `hsla(${galaxy.hue}, 50%, 60%, ${galaxy.opacity * 0.3})`);
        core_grad.addColorStop(1, `hsla(${galaxy.hue}, 50%, 50%, 0)`);
        ctx.fillStyle = core_grad;
        ctx.fillRect(-galaxy.size * 0.3, -galaxy.size * 0.3, galaxy.size * 0.6, galaxy.size * 0.6);

        // Spiral arms
        for (let arm = 0; arm < galaxy.arms; arm++) {
          const base_angle = (arm / galaxy.arms) * Math.PI * 2;
          for (let i = 0; i < 60; i++) {
            const progress = i / 60;
            const r = progress * galaxy.size;
            const angle = base_angle + progress * 3;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r * galaxy.tilt;

            // Vary star sizes in arms
            const size = (1 - progress) * 1.2 + Math.random() * 0.5;
            const alpha = galaxy.opacity * (1 - progress) * 0.8;

            // Color varies along the arm
            const star_hue = galaxy.hue + progress * 30 - 15;
            ctx.fillStyle = `hsla(${star_hue}, 50%, ${60 + progress * 20}%, ${alpha})`;
            ctx.fillRect(x - size / 2, y - size / 2, size, size);

            // Scatter stars around the arm
            if (Math.random() < 0.4) {
              const scatter = (1 - progress) * 8;
              const sx = x + (Math.random() - 0.5) * scatter;
              const sy = y + (Math.random() - 0.5) * scatter * galaxy.tilt;
              ctx.fillRect(sx, sy, size * 0.5, size * 0.5);
            }
          }
        }
        ctx.restore();
      });

      // Draw static background stars with twinkling
      bg_stars_ref.current.forEach((star) => {
        const twinkle = 0.6 + 0.4 * Math.sin(t * star.twinkle_speed + star.twinkle_offset);
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = star.color;
        ctx.fillRect(star.x - star.radius, star.y - star.radius, star.radius * 2, star.radius * 2);
      });
      ctx.globalAlpha = 1;

      // Draw star clusters
      clusters_ref.current.forEach((cluster) => {
        // Subtle cluster glow
        const grad = ctx.createRadialGradient(cluster.cx, cluster.cy, 0, cluster.cx, cluster.cy, 40);
        grad.addColorStop(0, 'rgba(200, 190, 255, 0.015)');
        grad.addColorStop(1, 'rgba(200, 190, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cluster.cx - 40, cluster.cy - 40, 80, 80);

        cluster.stars.forEach((star) => {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.fill();
        });
      });

      // Draw nebula clouds (colored gas)
      const nebula_configs = [
        { hue_range: [320, 360], sat: 60, offset: 0 },     // Pink/red
        { hue_range: [220, 260], sat: 50, offset: 2 },     // Blue
        { hue_range: [270, 310], sat: 55, offset: 4 },     // Purple
        { hue_range: [180, 220], sat: 40, offset: 1.5 },   // Teal
        { hue_range: [10, 40], sat: 45, offset: 3 },       // Warm orange
      ];

      nebula_configs.forEach((config, i) => {
        const nebula_x = cx + Math.cos(t * 0.08 + config.offset) * 250 + Math.sin(t * 0.05 + i) * 100;
        const nebula_y = cy + Math.sin(t * 0.1 + config.offset) * 200 + Math.cos(t * 0.06 + i) * 80;
        const hue = config.hue_range[0] + Math.random() * (config.hue_range[1] - config.hue_range[0]);
        const size = 200 + Math.sin(t * 0.3 + i) * 50;

        const gradient = ctx.createRadialGradient(nebula_x, nebula_y, 0, nebula_x, nebula_y, size);
        gradient.addColorStop(0, `hsla(${hue}, ${config.sat}%, 50%, 0.025)`);
        gradient.addColorStop(0.4, `hsla(${hue + 10}, ${config.sat - 10}%, 40%, 0.015)`);
        gradient.addColorStop(1, `hsla(${hue}, ${config.sat}%, 30%, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      // Draw orbiting stars with realistic colors
      stars_ref.current.forEach((star) => {
        star.angle += star.speed;
        star.distance -= 0.015 + star.layer * 0.005;

        if (star.distance < 100) {
          star.distance = Math.max(canvas.width, canvas.height) * 0.6 + Math.random() * 100;
          star.angle = Math.random() * Math.PI * 2;
        }

        star.x = cx + Math.cos(star.angle) * star.distance;
        star.y = cy + Math.sin(star.angle) * star.distance;

        const twinkle = 0.7 + 0.3 * Math.sin(t * (1.5 + star.layer) + star.angle * 10);
        const alpha = star.brightness * twinkle;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = get_star_color(star.color, alpha);
        ctx.fill();

        // Bright stars get a subtle glow
        if (star.layer === 2 && star.brightness > 0.7) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = get_star_color(star.color, alpha * 0.12);
          ctx.fill();

          // Cross-shaped diffraction spike for the brightest stars
          if (star.brightness > 0.85) {
            const spike_len = star.radius * 6;
            ctx.strokeStyle = get_star_color(star.color, alpha * 0.15);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(star.x - spike_len, star.y);
            ctx.lineTo(star.x + spike_len, star.y);
            ctx.moveTo(star.x, star.y - spike_len);
            ctx.lineTo(star.x, star.y + spike_len);
            ctx.stroke();
          }
        }
      });

      // Draw and update comets
      const remaining_comets: Comet[] = [];
      comets_ref.current.forEach((comet) => {
        comet.distance -= comet.speed;

        if (comet.distance > 0) {
          const comet_x = cx + Math.cos(comet.angle) * comet.distance;
          const comet_y = cy + Math.sin(comet.angle) * comet.distance;

          const tail_gradient = ctx.createLinearGradient(
            comet_x, comet_y,
            comet_x + Math.cos(comet.angle) * comet.tail_length,
            comet_y + Math.sin(comet.angle) * comet.tail_length
          );
          tail_gradient.addColorStop(0, 'rgba(200, 220, 255, 0.6)');
          tail_gradient.addColorStop(0.3, 'rgba(150, 200, 255, 0.3)');
          tail_gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');

          ctx.strokeStyle = tail_gradient;
          ctx.lineWidth = comet.size;
          ctx.beginPath();
          ctx.moveTo(comet_x, comet_y);
          ctx.lineTo(
            comet_x + Math.cos(comet.angle) * comet.tail_length,
            comet_y + Math.sin(comet.angle) * comet.tail_length
          );
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(comet_x, comet_y, comet.size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fill();

          if (comet.distance < 300) {
            const flare_intensity = 1 - (comet.distance / 300);
            ctx.beginPath();
            ctx.arc(comet_x, comet_y, comet.size * 4 * flare_intensity, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(150, 180, 255, ${0.3 * flare_intensity})`;
            ctx.fill();
          }

          remaining_comets.push(comet);
        }
      });
      comets_ref.current = remaining_comets;

      // Black hole core
      const pulse_size = 1 + pulse_ref.current * 0.3;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 * pulse_size);
      core.addColorStop(0, '#000000');
      core.addColorStop(0.7, '#000000');
      core.addColorStop(0.85, 'rgba(30, 10, 60, 0.8)');
      core.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, 80 * pulse_size, 0, Math.PI * 2);
      ctx.fill();

      // Update debris particles
      const remaining_debris: DebrisParticle[] = [];
      debris_ref.current.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        d.opacity *= 0.97;

        if (d.opacity > 0.01) {
          ctx.globalAlpha = d.opacity;
          ctx.fillStyle = d.color;
          ctx.fillRect(d.x, d.y, d.size, d.size);
          remaining_debris.push(d);
        }
      });
      debris_ref.current = remaining_debris;
      ctx.globalAlpha = 1;

      // Draw & update text particles
      const remaining: TextParticle[] = [];
      text_particles_ref.current.forEach((p) => {
        p.radius -= p.speed;
        p.angle += 0.02 + (1 / Math.max(p.radius, 20)) * 1.2;
        p.rotation += p.rotation_speed;
        p.speed += 0.012;

        const scale = Math.max(p.radius / 400, 0.1);
        p.font_size = p.original_font_size * scale;
        p.opacity = Math.min(1, p.radius / 100);

        p.x = cx + Math.cos(p.angle) * p.radius;
        p.y = cy + Math.sin(p.angle) * p.radius;

        if (p.radius > 20 && p.opacity > 0.01) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.font = `bold ${Math.max(p.font_size, 4)}px monospace`;

          if (p.hue === 15) {
            ctx.fillStyle = `hsl(${p.hue + Math.sin(t * 10 + p.angle) * 20}, 90%, 60%)`;
            ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
            ctx.shadowBlur = 15;
          } else if (p.hue === 200) {
            ctx.fillStyle = `hsl(${p.hue}, 80%, 70%)`;
            ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
            ctx.shadowBlur = 12;
          } else if (p.hue === 50) {
            ctx.fillStyle = `hsl(${p.hue}, 100%, ${50 + Math.random() * 30}%)`;
            ctx.shadowColor = 'rgba(255, 255, 100, 0.9)';
            ctx.shadowBlur = 18;
          } else {
            ctx.fillStyle = '#e0d0ff';
            ctx.shadowColor = 'rgba(140, 80, 255, 0.6)';
            ctx.shadowBlur = 8;
          }

          ctx.fillText(p.char, 0, 0);
          ctx.restore();
          remaining.push(p);
        }
      });
      text_particles_ref.current = remaining;

      if (had_text_particles_ref.current && remaining.length === 0) {
        had_text_particles_ref.current = false;
        on_animation_done_ref.current?.();
      }

      // Event horizon rings
      ctx.beginPath();
      ctx.arc(cx, cy, 82 * pulse_size, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 150, 100, ${0.2 + 0.08 * Math.sin(t * 2) + pulse_ref.current * 0.25})`;
      ctx.lineWidth = 2.5 * pulse_size;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 78 * pulse_size, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 200, 150, ${0.12 + 0.05 * Math.sin(t * 2.5) + pulse_ref.current * 0.15})`;
      ctx.lineWidth = 1.5 * pulse_size;
      ctx.stroke();

      animation_ref.current = requestAnimationFrame(draw);
    };

    animation_ref.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(comet_interval);
      cancelAnimationFrame(animation_ref.current);
    };
  }, [init_background_stars, init_stars, init_star_clusters, init_dust_clouds, init_milky_way, init_accretion, init_galaxies, spawn_comet]);

  return (
    <canvas
      ref={canvas_ref}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
});

export default BlackHole;
