import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-zinc-100 selection:bg-zinc-800 selection:text-white p-8">
      <div className="w-full max-w-sm space-y-12 text-center flex flex-col items-center">
        <div className="space-y-4 tracking-tighter">
          <h1 className="text-4xl font-light">
            Authentication
          </h1>
          <div className="w-8 h-[1px] bg-zinc-700 mx-auto rounded-full"></div>
        </div>
        
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest leading-relaxed">
          Access requires organizational credentials.
        </p>

        <form
          action={async () => {
            "use server"
            await signIn("microsoft-entra-id", { redirectTo: "/dashboard" })
          }}
          className="w-full pt-8 border-t border-zinc-800"
        >
          <button 
            type="submit" 
            className="w-full group relative inline-flex items-center justify-center px-8 py-4 text-xs font-mono tracking-widest uppercase transition-all duration-300 bg-white text-black hover:bg-zinc-200 rounded-sm gap-4 mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f35325" d="M0 0h10v10H0z"/>
              <path fill="#81bc06" d="M11 0h10v10H11z"/>
              <path fill="#05a6f0" d="M0 11h10v10H0z"/>
              <path fill="#ffba08" d="M11 11h10v10H11z"/>
            </svg>
            Sign in with Microsoft
          </button>
        </form>

        <form
          action={async () => {
            "use server"
            await signIn("guest", { redirectTo: "/dashboard" })
          }}
          className="w-full"
        >
          <button 
            type="submit" 
            className="w-full group relative inline-flex items-center justify-center px-8 py-4 text-xs font-mono tracking-widest uppercase transition-all duration-300 border border-zinc-700 text-zinc-300 hover:bg-zinc-900 rounded-sm"
          >
            Continue as Guest
          </button>
        </form>
      </div>
    </div>
  );
}
