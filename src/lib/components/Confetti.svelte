<script lang="ts">
    // A translated version of Fusion Obby's Confetti

    // Since Javascript doesn't have an inbuilt Vector2 type, we'll define our own custom one
    // to make math operations easier, also only add the methods we'll need for the confetti
    // to work
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

        magnitude() {
            return Math.sqrt(this.x ** 2 + this.y ** 2);
        }

        // Return a normalized vector
        unit() {
            const magnitude = this.magnitude();

            return new Vector2(this.x / magnitude, this.y / magnitude);
        }
    }
    const FUZZ = 0.4;
    const FORCE = 30;
    const FORCE_FUZZ = 20;

    // physics constants
    const DRAG = 0.95;
    const GRAVITY = 0.2;
    const ROTATE_SPEED = 1;
    /**
        -- generate a unique id for every particle
        id = HttpService:GenerateGUID(),
        -- store vars used by UI in state objects
        x = Value(origin.X),
        y = Value(origin.Y),
        rotation = Value(random:NextInteger(0, 360)),
        life = Value(5 + random:NextNumber(0, 2)),

        -- physics vars
        velocityX = velocity.X,
        velocityY = velocity.Y
    */
    let particleSet: Map<
        {
            id: number;
            x: number;
            y: number;
            rotation: number;
            life: number;
            velocityX: number;
            velocityY: number;
        },
        boolean
    > = new Map();

    /*
    local function fireConfetti(amount, origin, direction)
		local newParticleSet = particleSet:get()

		for _=1, amount do
			local velocity = direction.Unit
			velocity += Vector2.new(random:NextNumber(-FUZZ, FUZZ), random:NextNumber(-FUZZ, FUZZ))
			velocity = velocity.Unit * (FORCE + random:NextNumber(-FORCE_FUZZ, FORCE_FUZZ))

			newParticleSet[{
				-- generate a unique id for every particle
				id = HttpService:GenerateGUID(),
				-- store vars used by UI in state objects
				x = Value(origin.X),
				y = Value(origin.Y),
				rotation = Value(random:NextInteger(0, 360)),
				life = Value(5 + random:NextNumber(0, 2)),

				-- physics vars
				velocityX = velocity.X,
				velocityY = velocity.Y
			}] = true
		end

		particleSet:set(newParticleSet)
	end
    */
    function fireConfetti(amount: number, origin: Vector2, direction: Vector2) {
        for (let i = 0; i < amount; i++) {
            let velocity = direction.unit();

            velocity = velocity.add(new Vector2());
        }
    }
</script>
