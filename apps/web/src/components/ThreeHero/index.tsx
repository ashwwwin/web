'use client';
import * as THREE from 'three';
import { useRef, useMemo, useCallback, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, Vector3 } from '@react-three/fiber';
import { Lightformer, Environment, Html, Center, Stats, OrbitControls } from '@react-three/drei';
import {
  Physics,
  RigidBody,
  BallCollider,
  Vector3Tuple,
  CylinderCollider,
} from '@react-three/rapier';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import {
  BlackMaterial,
  BaseLogoModel,
  Lightning,
  blue,
  Controller,
  Eth,
  Globe,
  Phone,
  Headphones,
  Spikey,
  Play,
  Blobby,
  Cursor,
} from './models';

import baseLogo from './assets/base-logo.svg';

// Environnment
import environmentLight from './assets/environmentLight.jpg';
import Image, { StaticImageData } from 'next/image';

/* 
  The Main Scene
  - Keeps track of window focus, intersection observer
  - Listen to Mouse event for rotation context
  - Global setup such as gravity, dpr & Physics
*/

const gravity: Vector3Tuple = [0, 0, 0];

export default function Scene(): JSX.Element {
  const [isVisible, setIsVisible] = useState(true);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleVisibilityChange = useCallback(() => {
    setIsWindowFocused(!document.hidden);
  }, []);

  const handleScroll = useCallback(() => {
    setScrollPosition(window.scrollY);
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleVisibilityChange, handleScroll]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }, // Adjust this value as needed
    );

    observer.observe(containerRef.current);

    // containerRef.current.style.height = window.innerHeight + 'px';

    return () => {
      observer.disconnect();
    };
  }, []);

  const isActive = isVisible && scrollPosition <= 100;

  return (
    <div className="absolute h-[100dvh] w-[100dvw]" ref={containerRef}>
      <Canvas shadows frameloop={isActive ? 'always' : 'never'} camera={{ position: [0, 0, 5] }}>
        <fog attach="fog" args={['#111', 2.5, 7]} />

        <mesh>
          <sphereGeometry args={[7, 64, 64]} />
          <meshPhysicalMaterial color="#666" side={THREE.BackSide} depthTest={false} />
        </mesh>
        <Effects />
        <EnvironmentSetup />
        <Suspense fallback={<Loader />}>
          <Physics gravity={gravity} timeStep="vary" paused={!isActive}>
            <Pointer />
            <Everything />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}

function Effects() {
  return (
    <EffectComposer multisampling={0} stencilBuffer={false}>
      <Bloom mipmapBlur luminanceThreshold={0.5} intensity={1} />
      <SMAA />
    </EffectComposer>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="h-[50px] w-[50px] animate-pulse">
        <Image src={baseLogo as StaticImageData} alt="Loading..." className="w-[50px]" />
      </div>
    </Html>
  );
}

/* 
  The Environment
  - Loads the JPEG / HDR gainmap file
  - Set as global texture
*/
function EnvironmentSetup() {
  const light1: Vector3 = useMemo(() => [5, 5, -3], []);
  const light2: Vector3 = useMemo(() => [0, -15, -9], []);
  const light3: Vector3 = useMemo(() => [10, 1, 0], []);
  const light4: Vector3 = useMemo(() => [10, 10, 0], []);

  return (
    <Environment files={environmentLight.src}>
      <Lightformer
        form="ring"
        intensity={6}
        rotation-x={Math.PI / 2}
        position={light1}
        scale={4}
        color="white"
      />
      <Lightformer
        form="circle"
        intensity={20}
        rotation-x={Math.PI / 2}
        position={light2}
        scale={2}
      />
      <Lightformer
        form="circle"
        intensity={2}
        rotation-y={-Math.PI / 2}
        position={light3}
        scale={8}
      />
      <Lightformer
        form="ring"
        color="white"
        intensity={5}
        onUpdate={(self) => self.lookAt(0, 0, 0)}
        position={light4}
        scale={4}
      />
    </Environment>
  );
}

/* 
  The GLTF Scene
  - Loads the GLTF file / 3D scene
*/
export function Everything() {
  const groupRef = useRef();

  return (
    <group ref={groupRef} dispose={null}>
      <BaseLogo />
      <Lightning />
      <Balls />
      <Boxes />
      <Controller />
      <Eth />
      <Globe />
      <Phone />
      <Headphones />
      <Spikey />
      <Play />
      <Blobby />
      <Cursor />
    </group>
  );
}

function Boxes({ count = 10 }: { count?: number }) {
  const boxes = useMemo(
    () =>
      new Array(count).fill(null).map((_, index) => {
        return (
          <PhysicsMesh scale={0.5} gravityEffect={0.03} key={index}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <BlackMaterial />
            </mesh>
          </PhysicsMesh>
        );
      }),
    [count],
  );

  return <group>{boxes}</group>;
}

function Balls({ count = 10 }: { count?: number }) {
  const boxes = useMemo(
    () =>
      new Array(count).fill(null).map((_, index) => {
        return (
          <PhysicsMesh scale={0.25} gravityEffect={0.004} key={index}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.25, 64, 64]} />
              <meshPhysicalMaterial color={blue} />
            </mesh>
          </PhysicsMesh>
        );
      }),
    [count],
  );

  return <group>{boxes}</group>;
}

function BaseLogo() {
  const { size } = useThree();
  const logoRef = useRef<THREE.Group>(null!);
  const doneRef = useRef<boolean>(false);

  useFrame(({ mouse }) => {
    if (doneRef.current) {
      logoRef.current.rotation.y = THREE.MathUtils.lerp(logoRef.current.rotation.y, mouse.x, 0.05);
      logoRef.current.rotation.x = THREE.MathUtils.lerp(logoRef.current.rotation.x, -mouse.y, 0.05);
    } else {
      logoRef.current.rotation.y = THREE.MathUtils.lerp(logoRef.current.rotation.y, 0, 0.05);
    }
    logoRef.current.position.z = THREE.MathUtils.lerp(logoRef.current.position.z, 0, 0.05);

    // lerp never gets to 0
    if (logoRef.current.position.z > -0.01) {
      doneRef.current = true;
    }
  });

  let mobile = false;
  if (size.width < 768) {
    mobile = true;
  }

  return (
    <RigidBody type="kinematicPosition" colliders={false}>
      <CylinderCollider rotation={[Math.PI / 2, 0, 0]} args={[10, mobile ? 1.1 : 2]} />
      <group ref={logoRef} position={[0, 0, -10]}>
        <Center scale={mobile ? 0.075 : 0.13}>
          <BaseLogoModel />
        </Center>
      </group>
    </RigidBody>
  );
}

export function PhysicsMesh({
  vec = new THREE.Vector3(),
  r = THREE.MathUtils.randFloatSpread,
  scale = 1,
  gravityEffect = 0.2,
  children,
}: {
  vec?: THREE.Vector3;
  r?: (a: number) => number;
  scale?: number;
  gravityEffect?: number;
  children: React.ReactNode;
}) {
  const api = useRef();
  const { viewport } = useThree();

  const randomNumberBetween = (min: number, max: number) => {
    const posOrNeg = Math.random() > 0.5 ? 1 : -1;
    const num = Math.min(Math.random() * (max - min) + min, 14);
    return posOrNeg * num;
  };

  const pos = useMemo(
    () =>
      new THREE.Vector3(
        randomNumberBetween(viewport.width * 0.5, viewport.width * 2),
        randomNumberBetween(viewport.height * 0.5, viewport.height * 2),
        randomNumberBetween(viewport.width * 0.5, viewport.width * 2),
      ),
    [],
  );
  const rot = useMemo(() => new THREE.Vector3(r(Math.PI), r(Math.PI), r(Math.PI)), []);

  useFrame(() => {
    api.current?.applyImpulse(
      vec.copy(api.current.translation()).negate().multiplyScalar(gravityEffect),
    );
  });

  return (
    <RigidBody
      linearDamping={4}
      angularDamping={1}
      friction={0.1}
      position={pos.toArray()}
      rotation={rot.toArray()}
      ref={api}
      colliders={false}
      scale={scale}
    >
      <BallCollider args={[1]} />
      {children}
    </RigidBody>
  );
}

function Pointer({ vec = new THREE.Vector3() }) {
  const ref = useRef();
  const light = useRef();
  const { size } = useThree();
  let mobile = false;
  if (size.width < 768) {
    mobile = true;
  }

  useFrame(({ mouse, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0),
    );
    light.current?.position.set(0, 0, 10);
    light.current?.lookAt((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0);
  });
  return (
    <>
      <RigidBody position={[0, 0, 0]} type="kinematicPosition" colliders={false} ref={ref}>
        <BallCollider args={[mobile ? 1 : 2]} />
      </RigidBody>

      <directionalLight ref={light} position={[0, 0, 10]} intensity={10} color={blue} />
    </>
  );
}