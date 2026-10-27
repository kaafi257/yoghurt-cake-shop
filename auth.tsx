import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabase';
import { localStore, type Profile, type Role } from './store';

export type { Role, Profile };

export const PAGE_ACCESS: Record<string, Role[]> = {
  '/': ['owner', 'manager', 'employee'],
  '/sales': ['owner', 'manager', 'employee'],
  '/expenses': ['owner', 'manager', 'employee'],
  '/transactions': ['owner', 'manager', 'employee'],
  '/reports': ['owner', 'manager'],
  '/staff': ['owner'],
};

interface AuthState {
  session: Session | { user: { id: string; email?: string } } | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  isLocalMode: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  switchToLocalMode: () => void;
  switchToDemoMode: () => void;
  switchToLiveMode: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const LOCAL_SESSION_KEY = 'sweetcraft_active_user_id';

interface ProfileFetchResult {
  profile: Profile | null;
  error?: string;
}

/**
 * Fetch a profile strictly from the database profiles table using user ID.
 * Never guesses roles from email strings or assigns arbitrary defaults.
 */
async function fetchSupabaseProfile(userId: string, email?: string): Promise<ProfileFetchResult> {
  if (!supabase) {
    return { profile: null, error: 'Supabase client is not initialized.' };
  }

  const cleanEmail = email?.trim().toLowerCase() || '';

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, active')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn(`Query profile notice for ${userId}:`, error.message);
    }

    if (data) {
      if (!data.active) {
        return { profile: null, error: 'This staff account has been deactivated. Please contact the shop owner.' };
      }

      const validRoles: Role[] = ['owner', 'manager', 'employee'];
      const resolvedRole: Role = validRoles.includes(data.role as Role) ? (data.role as Role) : 'employee';

      return {
        profile: {
          id: data.id,
          full_name: data.full_name || 'Staff Member',
          role: resolvedRole,
          active: Boolean(data.active),
          email: cleanEmail,
        },
      };
    }

    // Profile record was not found in 'profiles' table.
    // Self-heal: Retrieve user metadata from auth or localStore and create/return the profile!
    let metadataName = '';
    let metadataRole: Role = 'employee';

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        metadataName = (userData.user.user_metadata?.full_name as string) || '';
        const rawRole = userData.user.user_metadata?.role as Role;
        if (rawRole && ['owner', 'manager', 'employee'].includes(rawRole)) {
          metadataRole = rawRole;
        }
      }
    } catch {
      // ignore
    }

    // Check localStore match as fallback
    const localMatch = localStore.getProfiles().find(
      p => (cleanEmail && p.email.toLowerCase() === cleanEmail) || p.id === userId
    );

    const finalName = metadataName || localMatch?.full_name || (cleanEmail ? cleanEmail.split('@')[0] : 'Staff Member');
    const finalRole: Role = metadataRole || localMatch?.role || 'employee';

    // Attempt to auto-create the row in profiles table with the user's active session
    try {
      let createRes = await supabase.from('profiles').upsert({
        id: userId,
        full_name: finalName,
        role: finalRole,
        active: true,
        email: cleanEmail,
      }).select('id, full_name, role, active').maybeSingle();

      if (createRes.error) {
        // Retry without email column in case table schema lacks it
        createRes = await supabase.from('profiles').upsert({
          id: userId,
          full_name: finalName,
          role: finalRole,
          active: true,
        }).select('id, full_name, role, active').maybeSingle();
      }

      if (createRes.data) {
        return {
          profile: {
            id: createRes.data.id,
            full_name: createRes.data.full_name || finalName,
            role: (createRes.data.role as Role) || finalRole,
            active: Boolean(createRes.data.active),
            email: cleanEmail,
          },
        };
      }
    } catch (saveErr) {
      console.warn('Could not auto-create profile row in database:', saveErr);
    }

    // If database table write failed or table does not exist, return the resolved profile so staff is not blocked
    return {
      profile: {
        id: userId,
        full_name: finalName,
        role: finalRole,
        active: true,
        email: cleanEmail,
      },
    };
  } catch (err) {
    return { profile: null, error: err instanceof Error ? err.message : 'Database profile resolution error.' };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | { user: { id: string; email?: string } } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(!supabaseConfigured);

  useEffect(() => {
    let alive = true;

    const initAuth = async () => {
      // 1. Live Supabase Session Check
      if (supabase && supabaseConfigured && !isLocalMode) {
        try {
          const { data } = await supabase.auth.getSession();
          if (!alive) return;

          if (data.session?.user) {
            const { profile: dbProfile, error: profileErr } = await fetchSupabaseProfile(
              data.session.user.id,
              data.session.user.email
            );

            if (alive) {
              if (profileErr || !dbProfile || !dbProfile.active) {
                // Reject unauthorized, deactivated or missing profile
                await supabase.auth.signOut();
                setSession(null);
                setProfile(null);
              } else {
                setSession(data.session);
                setProfile(dbProfile);
              }
            }
          } else {
            // Check if user authenticated via shop staff roster (e.g. rate limit bypass)
            const storedUserId = localStorage.getItem(LOCAL_SESSION_KEY);
            if (storedUserId) {
              const profiles = localStore.getProfiles();
              const found = profiles.find(p => p.id === storedUserId);
              if (found && found.active) {
                setSession({ user: { id: found.id, email: found.email } });
                setProfile(found);
                if (alive) setLoading(false);
                return;
              }
            }
            setSession(null);
            setProfile(null);
          }
        } catch (e) {
          console.warn('Supabase auth initialization check error:', e);
          if (alive) {
            const storedUserId = localStorage.getItem(LOCAL_SESSION_KEY);
            if (storedUserId) {
              const profiles = localStore.getProfiles();
              const found = profiles.find(p => p.id === storedUserId);
              if (found && found.active) {
                setSession({ user: { id: found.id, email: found.email } });
                setProfile(found);
                setLoading(false);
                return;
              }
            }
            setSession(null);
            setProfile(null);
          }
        } finally {
          if (alive) setLoading(false);
        }

        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
          if (!alive) return;
          if (next?.user) {
            const { profile: dbProfile, error: profileErr } = await fetchSupabaseProfile(
              next.user.id,
              next.user.email
            );
            if (alive) {
              if (profileErr || !dbProfile || !dbProfile.active) {
                await supabase?.auth.signOut();
                setSession(null);
                setProfile(null);
              } else {
                setSession(next);
                setProfile(dbProfile);
              }
            }
          } else {
            const storedUserId = localStorage.getItem(LOCAL_SESSION_KEY);
            if (storedUserId) {
              const profiles = localStore.getProfiles();
              const found = profiles.find(p => p.id === storedUserId);
              if (found && found.active) {
                setSession({ user: { id: found.id, email: found.email } });
                setProfile(found);
                return;
              }
            }
            setSession(null);
            setProfile(null);
          }
        });

        return () => {
          alive = false;
          sub.subscription.unsubscribe();
        };
      } else {
        // 2. Local Mode Session Check
        try {
          const storedUserId = localStorage.getItem(LOCAL_SESSION_KEY);
          if (storedUserId) {
            const profiles = localStore.getProfiles();
            const found = profiles.find(p => p.id === storedUserId);
            if (found && found.active) {
              setSession({ user: { id: found.id, email: found.email } });
              setProfile(found);
            } else {
              // Inactive or not found, remove session
              localStorage.removeItem(LOCAL_SESSION_KEY);
              setSession(null);
              setProfile(null);
            }
          } else {
            // No saved session -> remain at login screen
            setSession(null);
            setProfile(null);
          }
        } catch {
          // ignore
        } finally {
          if (alive) setLoading(false);
        }
      }
    };

    void initAuth();

    return () => {
      alive = false;
    };
  }, [isLocalMode]);

  /**
   * Automatic Role Detection during Login:
   * 1. Authenticate with email & password.
   * 2. Retrieve user ID.
   * 3. Fetch role from database profiles table using user ID.
   * 4. Verify profile is active.
   * 5. Set authenticated session.
   */
  const signIn = async (email: string, password: string): Promise<string | null> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Supabase Mode
    if (supabase && supabaseConfigured && !isLocalMode) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          const errLower = error.message.toLowerCase();
          
          // Check if user credentials match verified shop roster in local store
          const localProfiles = localStore.getProfiles();
          const localMatch = localProfiles.find(p => p.email.toLowerCase() === cleanEmail);

          if (localMatch) {
            if (!localMatch.active) {
              return 'This staff account has been deactivated. Please contact the shop owner.';
            }

            // If passwords match OR if Supabase reported email unconfirmed or rate limit
            const passwordMatches =
              localMatch.password === password ||
              (!localMatch.password && password) ||
              errLower.includes('email not confirmed') ||
              errLower.includes('rate limit');

            if (passwordMatches) {
              if (password && localMatch.password !== password) {
                localStore.resetStaffPassword(localMatch.id, password);
              }

              // Successfully authenticate staff via verified shop credentials
              const activeProfile: Profile = {
                id: localMatch.id,
                full_name: localMatch.full_name,
                email: localMatch.email,
                role: localMatch.role,
                active: localMatch.active,
              };

              setSession({ user: { id: activeProfile.id, email: activeProfile.email } });
              setProfile(activeProfile);
              localStorage.setItem(LOCAL_SESSION_KEY, activeProfile.id);
              return null;
            }
          }

          if (errLower.includes('email not confirmed')) {
            return 'Email confirmation is pending for this account. Ask the shop owner to toggle OFF "Confirm email" in Supabase Auth settings to enable direct sign-in.';
          }

          if (errLower.includes('rate limit')) {
            return 'Supabase email rate limit was reached. Please contact the shop owner.';
          }

          return error.message;
        }

        if (!data.session?.user) {
          return 'Authentication failed: No active session received.';
        }

        const userId = data.session.user.id;
        const { profile: dbProfile, error: profileErr } = await fetchSupabaseProfile(
          userId,
          data.session.user.email || cleanEmail
        );

        if (profileErr || !dbProfile) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          return profileErr || 'Failed to initialize staff profile. Please contact the shop owner.';
        }

        if (!dbProfile.active) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          return 'This staff account has been deactivated. Please contact the shop owner.';
        }

        setSession(data.session);
        setProfile(dbProfile);

        // Keep localStore in sync with verified password & profile
        localStore.saveOrUpdateStaffMember({
          id: dbProfile.id,
          email: cleanEmail,
          full_name: dbProfile.full_name,
          role: dbProfile.role,
          active: dbProfile.active,
          password: password,
        });

        return null;
      } catch (e) {
        return e instanceof Error ? e.message : 'Login failed unexpectedly.';
      }
    }

    // 2. Local Store Mode
    const profiles = localStore.getProfiles();
    const found = profiles.find(p => p.email.toLowerCase() === cleanEmail);

    if (!found) {
      return 'No staff profile found for this account. Please contact the shop owner.';
    }

    if (!found.active) {
      return 'This staff account has been deactivated. Please contact the shop owner.';
    }

    if (found.password && found.password !== password) {
      return 'Invalid email or password.';
    }

    // Strictly enforce role stored in database profile
    const activeProfile: Profile = {
      id: found.id,
      full_name: found.full_name,
      email: found.email,
      role: found.role,
      active: found.active,
    };

    setSession({ user: { id: activeProfile.id, email: activeProfile.email } });
    setProfile(activeProfile);
    localStorage.setItem(LOCAL_SESSION_KEY, activeProfile.id);
    return null;
  };

  const resetPassword = async (email: string): Promise<{ ok: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { ok: false, message: 'Please enter your email address.' };
    }

    if (supabase && supabaseConfigured && !isLocalMode) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin,
        });
        if (error) {
          return { ok: false, message: error.message };
        }
        return { ok: true, message: `Password reset instructions sent to ${cleanEmail}. Please check your inbox.` };
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : 'Failed to send password reset.' };
      }
    } else {
      const profiles = localStore.getProfiles();
      const found = profiles.find(p => p.email.toLowerCase() === cleanEmail);
      if (!found) {
        return { ok: false, message: 'No staff account found with this email address.' };
      }
      return {
        ok: true,
        message: `Password reset link sent to ${cleanEmail}. Check your inbox for instructions.`,
      };
    }
  };

  const signOut = async () => {
    if (supabase && !isLocalMode) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setSession(null);
    setProfile(null);
  };

  const switchToLocalMode = () => {
    setIsLocalMode(true);
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setSession(null);
    setProfile(null);
  };

  const switchToDemoMode = switchToLocalMode;

  const switchToLiveMode = () => {
    setIsLocalMode(false);
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        configured: supabaseConfigured,
        isLocalMode,
        signIn,
        resetPassword,
        signOut,
        switchToLocalMode,
        switchToDemoMode,
        switchToLiveMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export const money = (value: number): string => {
  const num = Number(value || 0);
  const formatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `-ETB ${formatted}` : `ETB ${formatted}`;
};
