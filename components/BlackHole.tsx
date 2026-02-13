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
}

export interface BlackHoleHandle {
  yell: (text: string) => void;
}

interface BlackHoleProps {
  on_animation_done?: () => void;
}

const BlackHole = forwardRef<BlackHoleHandle, BlackHoleProps>(function BlackHole({ on_animation_done }, ref) {
  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const animation_ref = useRef<number>(0);
  const stars_ref = useRef<Star[]>([]);
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

  const init_stars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    const cx = width / 2;
    const cy = height / 2;
    const max_dist = Math.max(width, height);

    for (let i = 0; i < 500; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * max_dist * 0.6;
      stars.push({
        x: cx + Math.cos(angle) * distance,
        y: cy + Math.sin(angle) * distance,
        radius: Math.random() * 1.8 + 0.2,
        angle,
        distance,
        speed: 0.0001 + Math.random() * 0.0003,
        brightness: 0.3 + Math.random() * 0.7,
        color: Math.random(),
      });
    }
    stars_ref.current = stars;
  }, []);

  const init_accretion = useCallback(() => {
    const particles: AccretionParticle[] = [];
    for (let i = 0; i < 180; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 100 + Math.random() * 140,
        speed: 0.006 + Math.random() * 0.012,
        size: Math.random() * 3 + 0.8,
        brightness: 0.3 + Math.random() * 0.7,
        color_offset: Math.random(),
      });
    }
    accretion_ref.current = particles;
  }, []);

  const init_galaxies = useCallback((width: number, height: number) => {
    const galaxies: Galaxy[] = [];
    for (let i = 0; i < 3; i++) {
      galaxies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        rotation: Math.random() * Math.PI * 2,
        size: 60 + Math.random() * 80,
        opacity: 0.15 + Math.random() * 0.15,
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

    // Start text near the top of the screen where the input was
    const start_y = 180;
    const char_width = 18;
    const max_chars_per_line = Math.floor((cx * 1.4) / char_width);
    let line = 0;
    let col = 0;

    // Random effect type: 0=normal, 1=fire, 2=ice, 3=electric
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

      let hue = 270; // Default purple
      if (effect_type === 1) hue = 15; // Fire (orange)
      else if (effect_type === 2) hue = 200; // Ice (cyan)
      else if (effect_type === 3) hue = 50; // Electric (yellow)

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

    // Spawn debris particles from text start position
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
      pulse_ref.current = 1; // Trigger pulse effect
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
      init_stars(canvas.width, canvas.height);
      init_galaxies(canvas.width, canvas.height);
    };

    resize();
    init_accretion();
    window.addEventListener('resize', resize);

    // Spawn comets occasionally
    const comet_interval = setInterval(() => {
      if (Math.random() < 0.3) spawn_comet();
    }, 4000);

    const draw = () => {
      time_ref.current += 0.016;
      const t = time_ref.current;
      const cx = center_ref.current.x;
      const cy = center_ref.current.y;

      // Decay pulse
      pulse_ref.current *= 0.95;

      // Clear
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background galaxies
      galaxies_ref.current.forEach((galaxy) => {
        ctx.save();
        ctx.translate(galaxy.x, galaxy.y);
        ctx.rotate(galaxy.rotation);
        ctx.globalAlpha = galaxy.opacity * (0.8 + 0.2 * Math.sin(t * 0.5));

        const spiral_arms = 3;
        for (let arm = 0; arm < spiral_arms; arm++) {
          const base_angle = (arm / spiral_arms) * Math.PI * 2;
          for (let i = 0; i < 40; i++) {
            const radius = (i / 40) * galaxy.size;
            const angle = base_angle + (i / 10);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.4;
            const size = (1 - i / 40) * 1.5;
            ctx.fillStyle = `rgba(150, 120, 200, ${0.3 * (1 - i / 40)})`;
            ctx.fillRect(x, y, size, size);
          }
        }
        ctx.restore();
      });

      // Draw nebula clouds
      for (let i = 0; i < 3; i++) {
        const nebula_x = cx + Math.cos(t * 0.1 + i * 2) * 200;
        const nebula_y = cy + Math.sin(t * 0.15 + i * 2) * 150;
        const gradient = ctx.createRadialGradient(nebula_x, nebula_y, 0, nebula_x, nebula_y, 250);

        if (i === 0) {
          gradient.addColorStop(0, 'rgba(255, 100, 150, 0.03)');
          gradient.addColorStop(1, 'rgba(255, 100, 150, 0)');
        } else if (i === 1) {
          gradient.addColorStop(0, 'rgba(100, 150, 255, 0.025)');
          gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(200, 100, 255, 0.02)');
          gradient.addColorStop(1, 'rgba(200, 100, 255, 0)');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw stars with variety
      stars_ref.current.forEach((star) => {
        star.angle += star.speed;
        star.distance -= 0.02;

        if (star.distance < 100) {
          star.distance = Math.max(canvas.width, canvas.height) * 0.6;
          star.angle = Math.random() * Math.PI * 2;
        }

        star.x = cx + Math.cos(star.angle) * star.distance;
        star.y = cy + Math.sin(star.angle) * star.distance;

        const twinkle = 0.7 + 0.3 * Math.sin(t * 2 + star.angle * 10);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

        // Color variation
        if (star.color < 0.3) {
          ctx.fillStyle = `rgba(200, 210, 255, ${star.brightness * twinkle})`; // Blue
        } else if (star.color < 0.6) {
          ctx.fillStyle = `rgba(255, 240, 200, ${star.brightness * twinkle})`; // Yellow
        } else {
          ctx.fillStyle = `rgba(255, 200, 210, ${star.brightness * twinkle})`; // Pink
        }
        ctx.fill();
      });

      // Draw and update comets
      const remaining_comets: Comet[] = [];
      comets_ref.current.forEach((comet) => {
        comet.distance -= comet.speed;

        if (comet.distance > 0) {
          const comet_x = cx + Math.cos(comet.angle) * comet.distance;
          const comet_y = cy + Math.sin(comet.angle) * comet.distance;

          // Comet tail
          const tail_gradient = ctx.createLinearGradient(
            comet_x, comet_y,
            comet_x + Math.cos(comet.angle) * comet.tail_length,
            comet_y + Math.sin(comet.angle) * comet.tail_length
          );
          tail_gradient.addColorStop(0, 'rgba(200, 220, 255, 0.6)');
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

          // Comet head
          ctx.beginPath();
          ctx.arc(comet_x, comet_y, comet.size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fill();

          // Lens flare when near core
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

      // Draw accretion disk glow (outer) with pulse
      const pulse_size = 1 + pulse_ref.current * 0.3;
      const outer_glow = ctx.createRadialGradient(cx, cy, 80 * pulse_size, cx, cy, 320 * pulse_size);
      outer_glow.addColorStop(0, 'rgba(80, 60, 200, 0)');
      outer_glow.addColorStop(0.3, `rgba(100, 80, 220, ${0.08 + pulse_ref.current * 0.05})`);
      outer_glow.addColorStop(0.6, `rgba(140, 80, 255, ${0.04 + pulse_ref.current * 0.03})`);
      outer_glow.addColorStop(1, 'rgba(140, 80, 255, 0)');
      ctx.fillStyle = outer_glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw accretion disk particles with more color variety
      accretion_ref.current.forEach((p) => {
        p.angle += p.speed;
        const wobble = Math.sin(t * 3 + p.angle * 2) * 5;
        const px = cx + Math.cos(p.angle) * (p.radius + wobble);
        const py = cy + Math.sin(p.angle) * (p.radius * 0.35 + wobble * 0.3);

        // More vibrant color mixing (orange, blue, purple, pink)
        let r, g, b;
        if (p.color_offset < 0.25) {
          r = 255; g = 120; b = 80; // Orange
        } else if (p.color_offset < 0.5) {
          r = 80; g = 150; b = 255; // Blue
        } else if (p.color_offset < 0.75) {
          r = 180; g = 80; b = 255; // Purple
        } else {
          r = 255; g = 100; b = 180; // Pink
        }

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.brightness * 0.6})`;
        ctx.fill();

        // Lens flare on bright particles near core
        if (p.radius < 150 && p.brightness > 0.6) {
          ctx.beginPath();
          ctx.arc(px, py, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.1)`;
          ctx.fill();
        }
      });

      // Draw inner accretion glow with breathing effect
      const breath = 1 + Math.sin(t * 1.5) * 0.1;
      const inner_glow = ctx.createRadialGradient(cx, cy, 40 * breath, cx, cy, 180 * breath);
      inner_glow.addColorStop(0, `rgba(120, 80, 255, ${0.18 + pulse_ref.current * 0.1})`);
      inner_glow.addColorStop(0.3, `rgba(100, 60, 220, ${0.1 + pulse_ref.current * 0.05})`);
      inner_glow.addColorStop(0.7, 'rgba(80, 40, 180, 0.04)');
      inner_glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = inner_glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 180 * breath, 0, Math.PI * 2);
      ctx.fill();

      // Draw black hole core with pulse
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

      // Draw & update text particles with effects
      const remaining: TextParticle[] = [];
      text_particles_ref.current.forEach((p) => {
        // Slower spiral — gentle acceleration
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

          // Different visual effects based on hue
          if (p.hue === 15) {
            // Fire effect
            ctx.fillStyle = `hsl(${p.hue + Math.sin(t * 10 + p.angle) * 20}, 90%, 60%)`;
            ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
            ctx.shadowBlur = 15;
          } else if (p.hue === 200) {
            // Ice effect
            ctx.fillStyle = `hsl(${p.hue}, 80%, 70%)`;
            ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
            ctx.shadowBlur = 12;
          } else if (p.hue === 50) {
            // Electric effect
            ctx.fillStyle = `hsl(${p.hue}, 100%, ${50 + Math.random() * 30}%)`;
            ctx.shadowColor = 'rgba(255, 255, 100, 0.9)';
            ctx.shadowBlur = 18;
          } else {
            // Normal purple
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

      // Notify when all text particles are consumed
      if (had_text_particles_ref.current && remaining.length === 0) {
        had_text_particles_ref.current = false;
        on_animation_done_ref.current?.();
      }

      // Event horizon ring with pulse
      ctx.beginPath();
      ctx.arc(cx, cy, 82 * pulse_size, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(140, 100, 255, ${0.15 + 0.05 * Math.sin(t * 2) + pulse_ref.current * 0.2})`;
      ctx.lineWidth = 2 * pulse_size;
      ctx.stroke();

      animation_ref.current = requestAnimationFrame(draw);
    };

    animation_ref.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(comet_interval);
      cancelAnimationFrame(animation_ref.current);
    };
  }, [init_stars, init_accretion, init_galaxies, spawn_comet]);

  return (
    <canvas
      ref={canvas_ref}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
});

export default BlackHole;
