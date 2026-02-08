import "./globals.css";
import { AuthProvider } from "../lib/auth";
import { AdminProvider } from "../lib/admin";
import { ToastProvider } from "../lib/toast";
import Header from "../components/Header";
import Toaster from "../components/Toaster";

export const metadata = {
  title: "Evote",
  description: "Secure & Professional Voting Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-800 bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <AdminProvider>
            <ToastProvider>
              <Toaster />
              
              <div className="min-h-screen flex flex-col relative">
                
                {/* لمسة احترافية: شريط علوي مموه يدمج الأزرق والأخضر بنعومة فائقة */}
                <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-50/50 to-transparent -z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl -z-10 pointer-events-none" />

                {/* Main Container */}
                <div className="container-app py-6 md:py-10 flex-grow flex flex-col gap-8">
                  
                  {/* Header Section */}
                  <header className="w-full">
                     <Header />
                  </header>
                  
                  {/* Main Content Area */}
                  <main className="w-full fade-in-up">
                    {children}
                  </main>
                  
                </div>
                
                {/* Footer (اختياري - يضيف احترافية) */}
                <footer className="py-6 text-center text-sm text-slate-400 border-t border-slate-200/60 mt-auto">
                  <p>© {new Date().getFullYear()} Evote Platform. Secure & Verified.</p>
                </footer>

              </div>
            </ToastProvider>
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}