<script lang="ts">
    import { v4 as Uuidv4 } from "uuid";
    import { onMount } from "svelte";
    import { getRandom, getRandomInt } from "$lib/utility";
    import Confetti from "./Confetti.svelte";
    import { confetti, windowRect } from "$lib/stores";
    // A translated version of Fusion Obby's Confetti with some differences

    // Since Javascript doesn't have an inbuilt Vector2 type, we'll define our own custom one
    // to make math operations easier, also only add the methods we'll need for the confetti
    class Vector2 {
        x: number;
        y: number;

        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }

        add(vector2: Vector2) {
            return new Vector2(this.x + vector2.x, this.y + vector2.y);
        }

        multiply(scale: number) {
            return new Vector2(this.x * scale, this.y * scale);
        }

        magnitude() {
            return Math.sqrt(this.x ** 2 + this.y ** 2);
        }

        unit() {
            const magnitude = this.magnitude();

            return new Vector2(this.x / magnitude, this.y / magnitude);
        }
    }

    // firing constants
    const FUZZ = 0.4;
    const FORCE = 800;
    const FORCE_FUZZ = 400;

    // physics constants (adjusted for deltatime hopefully)
    const DRAG = 0.35;
    const GRAVITY = 150;
    const ROTATE_SPEED = 60;

    // we save particles into the keys of this table, not the values
    // this means each particle is it's own unique, stable key
    let particleSet: Map<
        {
            id: string;
            x: number;
            y: number;
            rotation: number;
            life: number;
            velocityX: number;
            velocityY: number;
        },
        boolean
    > = new Map();
    let animationId: number;

    function fireConfetti(amount: number, origin: Vector2, direction: Vector2) {
        for (let i = 0; i < amount; i++) {
            let velocity = direction.unit();

            velocity = velocity.add(
                new Vector2(getRandom(-FUZZ, FUZZ), getRandom(-FUZZ, FUZZ)),
            );
            velocity = velocity
                .unit()
                .multiply(FORCE + getRandom(-FORCE_FUZZ, FORCE_FUZZ));

            particleSet.set(
                {
                    // generate a unique id for every particle
                    id: Uuidv4(),
                    // store vars used by UI in state objects
                    x: origin.x,
                    y: origin.y,
                    rotation: getRandomInt(0, 360),
                    life: 5 + getRandomInt(0, 2),

                    // physics var
                    velocityX: velocity.x,
                    velocityY: velocity.y,
                },
                true,
            );
        }

        particleSet = particleSet;
    }

    let previousTimestamp: number | undefined;

    function updateConfetti(timestamp: number) {
        if (previousTimestamp === undefined) {
            previousTimestamp = timestamp;
            animationId = requestAnimationFrame(updateConfetti);
            return;
        }

        const deltaTime = (timestamp - previousTimestamp) * 0.001; // Convert to seconds

        for (const [particle] of particleSet) {
            const newLife = particle.life - deltaTime;

            if (newLife <= 0) {
                particleSet.delete(particle);
                continue;
            } else {
                particle.life = newLife;
            }

            particle.x += particle.velocityX * deltaTime;
            particle.y += particle.velocityY * deltaTime;
            particle.velocityX *= Math.pow(DRAG, deltaTime);
            particle.velocityY *= Math.pow(DRAG, deltaTime);
            particle.velocityY += GRAVITY * deltaTime;
            particle.rotation += ROTATE_SPEED * deltaTime;
        }

        particleSet = particleSet;
        previousTimestamp = timestamp;

        if (particleSet.size > 0) {
            animationId = requestAnimationFrame(updateConfetti);
        } else {
            previousTimestamp = undefined; // Reset for next animation cycle
        }
    }

    onMount(() => {
        // Instead of firing confetti from an event, it's changed to being fired from
        // when the svelte store changes
        const unsubscribe = confetti.subscribe((shouldFire) => {
            if (!$windowRect || !shouldFire[0]) return;
            const amount = 100;

            const bottomLeft = new Vector2(0, window.innerHeight);
            const bottomRight = new Vector2(
                window.innerWidth,
                window.innerHeight,
            );

            fireConfetti(amount, bottomLeft, new Vector2(1, -1));
            fireConfetti(amount, bottomRight, new Vector2(-1, -1));
            animationId = requestAnimationFrame(updateConfetti);
        });

        return () => {
            cancelAnimationFrame(animationId);
            unsubscribe();
        };
    });
</script>

<div class="h-[100vh] w-[100vw] absolute z-10 pointer-events-none">
    <!--Use the particle property as the stable key-->
    {#each particleSet as [particle] (particle)}
        <Confetti
            x={particle.x}
            y={particle.y}
            rotation={particle.rotation}
            lifetime={particle.life}
        />
    {/each}
</div>
