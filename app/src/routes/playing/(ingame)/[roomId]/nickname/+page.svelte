<script>
    import { enhance } from "$app/forms";
</script>

<div class="hero min-h-screen bg-background">
    <div class="hero-content text-center">
        <div class="card card-compact rounded-lg w-72 bg-primary-600">
            <form method="POST" class="card-body" use:enhance>
                <h2
                    class="card-title text-xl text-text-50 font-metropolis font-bold self-center text-center"
                >
                    Hello, my name is
                </h2>
                <input
                    name="nickname"
                    class="input focus:ring-2 focus:ring-gray-500 border-gray-500 bg-white text-gray-500 text-center font-metropolis font-bold"
                    placeholder="Bob"
                    required
                />
                <button class="btn btn-neutral min-h-10 h-10">Enter</button>
            </form>
        </div>
    </div>
</div>
