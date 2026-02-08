"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
import { useAdmin } from "../lib/admin";

// --- Components ---

function NavLink({ href, children, mobile = false, onClick }) {
  const pathname = usePathname();
  const active = pathname === href;

  const baseClasses = "text-sm font-medium transition-all duration-200";
  const desktopClasses = `px-4 py-2 rounded-full ${
    active
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60 shadow-sm"
      : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
  }`;
  const mobileClasses = `block px-4 py-3 rounded-xl ${
    active
      ? "bg-emerald-50/80 text-emerald-900 font-semibold"
      : "text-slate-600 hover:bg-slate-50 hover:text-emerald-800"
  }`;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${baseClasses} ${mobile ? mobileClasses : desktopClasses}`}
    >
      {children}
    </Link>
  );
}

function StatusBadge({ type, label, id }) {
  const isVoter = type === "voter";
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
      isVoter 
        ? "bg-slate-50 border-slate-100 text-slate-500" 
        : "bg-slate-900 border-slate-800 text-slate-200 shadow-md"
    }`}>
      <div className={`h-2 w-2 rounded-full animate-pulse ${isVoter ? "bg-emerald-500" : "bg-emerald-400"}`} />
      <span className={isVoter ? "" : "text-slate-400"}>{label}:</span>
      <span className={`font-mono ${isVoter ? "text-slate-700" : "text-white"}`}>{id}</span>
    </div>
  );
}

// --- Main Header ---

export default function Header() {
  const router = useRouter();
  const voterAuth = useAuth();
  const adminAuth = useAdmin();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logout Handlers
  const handleLogout = (type) => {
    if (type === "voter") voterAuth.logout();
    if (type === "admin") adminAuth.logout();
    setMobileMenuOpen(false);
    router.push("/");
  };

  // Navigation Config
  const showVoterNav = voterAuth.isLoggedIn;
  const showAdminNav = adminAuth.isLoggedIn && !voterAuth.isLoggedIn;

  const links = (() => {
    if (showVoterNav) return [
      { href: "/ballot", label: "Ballot" },
      { href: "/vote", label: "Vote" },
      { href: "/profile", label: "Profile" },
    ];
    if (showAdminNav) return [
      { href: "/admin", label: "Dashboard" },
    ];
    return [
      { href: "/", label: "Home" },
      { href: "/register", label: "Register" },
      { href: "/login", label: "Login" },
      { href: "/admin/login", label: "Admin Portal" },
    ];
  })();

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
          isScrolled || mobileMenuOpen
            ? "bg-white/90 backdrop-blur-xl border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]"
            : "bg-white/60 backdrop-blur-md border-transparent shadow-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            Evote
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href}>{link.label}</NavLink>
            ))}
            
            {(showVoterNav || showAdminNav) && (
              <button
                onClick={() => handleLogout(showVoterNav ? "voter" : "admin")}
                className="ml-2 text-sm font-semibold px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-all shadow-sm"
              >
                Logout
              </button>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl px-6 py-4 flex flex-col gap-2 animate-in slide-in-from-top-5">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} mobile onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            {(showVoterNav || showAdminNav) && (
              <button
                onClick={() => handleLogout(showVoterNav ? "voter" : "admin")}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        )}

        {/* Status Bar Indicator */}
        <div className="hidden md:block absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent" />
      </header>

      {/* Persistent Status Bar (Below Header) */}
      {(showVoterNav || showAdminNav) && (
        <div className="max-w-7xl mx-auto px-6 mb-8 -mt-4 animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-3 pt-4">
            {showVoterNav && voterAuth.voter?.voterId && (
              <>
                <StatusBadge type="voter" label="Voter ID" id={voterAuth.voter.voterId} />
                {voterAuth.voter?.hasVoted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs text-emerald-700 font-bold shadow-sm">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    Submitted
                  </span>
                )}
              </>
            )}
            
            {showAdminNav && (
              <StatusBadge type="admin" label="Session" id="Active" />
            )}
          </div>
        </div>
      )}
    </>
  );
}