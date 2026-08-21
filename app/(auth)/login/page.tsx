import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-2">Sign in to Anchor</h1>
      <p className="text-gray-600 mb-8 text-center max-w-sm">
        Use your Microsoft account to get started.
      </p>
      
      <form
        action={async () => {
          "use server"
          await signIn("microsoft-entra-id", { redirectTo: "/dashboard" })
        }}
      >
        <button 
          type="submit"
          className="bg-[#0078D4] text-white px-6 py-3 rounded hover:bg-[#005A9E] transition-colors font-medium flex items-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <path fill="#f35325" d="M0 0h10v10H0z"/>
            <path fill="#81bc06" d="M11 0h10v10H11z"/>
            <path fill="#05a6f0" d="M0 11h10v10H0z"/>
            <path fill="#ffba08" d="M11 11h10v10H11z"/>
          </svg>
          Sign in with Microsoft
        </button>
      </form>

      <p className="mt-8 text-sm text-gray-500">
        Only authorized users can access documents.
      </p>
    </div>
  );
}
