'use client';

import { useRef, useState } from 'react';
import BlackHole from '@/components/BlackHole';
import YellInput from '@/components/YellInput';
import type { BlackHoleHandle } from '@/components/BlackHole';

export default function Home() {
  const black_hole_ref = useRef<BlackHoleHandle>(null);
  const [is_yelling, set_is_yelling] = useState(false);

  const handle_yell = (text: string) => {
    set_is_yelling(true);
    black_hole_ref.current?.yell(text);
  };

  const handle_animation_done = () => {
    set_is_yelling(false);
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <BlackHole ref={black_hole_ref} on_animation_done={handle_animation_done} />
      <YellInput on_yell={handle_yell} is_hidden={is_yelling} />
    </div>
  );
}
