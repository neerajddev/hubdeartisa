'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button/Button';
import Link from 'next/link';
import { ROUTES } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const SPECIALTIES = [
  'Interior Rendering',
  'Exterior Rendering',
  '3D Floor Plans',
  'Architectural Animation',
  'Virtual Reality',
  'Landscape Design',
  'Other',
];

export default function ArtistRegistrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    state: '',
    country: '',
    experience: '',
    specialties: [] as string[],
    customSpecialty: '',
    languages: '',
    phone: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.includes(specialty)
        ? formData.specialties.filter(s => s !== specialty)
        : [...formData.specialties, specialty],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Validate at least one specialty selected
    if (formData.specialties.length === 0) {
      setError('Please select at least one specialty');
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists in artist_profiles
      const { data: existingArtist } = await supabase
        .from('artist_profiles')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingArtist) {
        throw new Error('This email is already registered as an artist');
      }

      // Check if email already exists in client_profiles
      const { data: existingClient } = await supabase
        .from('client_profiles')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingClient) {
        throw new Error('This email is already registered as a client. Each user can only have one account type.');
      }

      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      if (!authData.session) {
        localStorage.setItem(
          'pendingRegistration',
          JSON.stringify({
            role: 'artist',
            profile: {
              full_name: formData.fullName,
              email: formData.email,
              state: formData.state,
              country: formData.country,
              experience: formData.experience,
              specialties: formData.specialties,
              custom_specialty: formData.customSpecialty || null,
              languages: formData.languages,
              phone: formData.phone || null,
              bio: formData.bio,
            },
          })
        );
        alert('Registration successful! Please check your email to verify your account, then sign in to complete your profile.');
        router.push('/sign-in');
        return;
      }

      // 2. Create artist profile
      const { error: profileError } = await supabase
        .from('artist_profiles')
        .insert({
          user_id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          state: formData.state,
          country: formData.country,
          experience: formData.experience,
          specialties: formData.specialties,
          custom_specialty: formData.customSpecialty || null,
          languages: formData.languages,
          phone: formData.phone || null,
          bio: formData.bio,
        });

      if (profileError) throw profileError;

      // 3. Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'artist',
        });

      if (roleError) throw roleError;

      // Success - redirect to artist dashboard
      alert('Registration successful! Please check your email to verify your account.');
      router.push(ROUTES.artistDashboard);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.pageTitle}>Join as a 3D Artist</h1>
          <p className={styles.pageDescription}>
            Create your profile and start showcasing your work to clients worldwide
          </p>
        </div>
      </div>

      <section className={styles.formSection}>
        <div className="container">
          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="fullName" className={styles.label}>
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.label}>
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={styles.input}
                    minLength={8}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={styles.input}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="state" className={styles.label}>
                    State *
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter your state"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="country" className={styles.label}>
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter your country"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="experience" className={styles.label}>
                  Years of Experience *
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">Select experience</option>
                  <option value="0-2 years">0-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="6-10 years">6-10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Specialties * (Select all that apply)</label>
                <div className={styles.checkboxGrid}>
                  {SPECIALTIES.map((specialty) => (
                    <label key={specialty} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={() => handleSpecialtyToggle(specialty)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.specialties.includes('Other') && (
                <div className={styles.formGroup}>
                  <label htmlFor="customSpecialty" className={styles.label}>
                    Please specify your specialty
                  </label>
                  <input
                    type="text"
                    id="customSpecialty"
                    name="customSpecialty"
                    value={formData.customSpecialty}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter your specialty..."
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="languages" className={styles.label}>
                  Languages Known *
                </label>
                <input
                  type="text"
                  id="languages"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., English, Spanish, French"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="bio" className={styles.label}>
                  Professional Bio *
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className={styles.textarea}
                  rows={5}
                  placeholder="Tell clients about your experience, skills, and what makes you unique..."
                  required
                />
              </div>

              <div className={styles.formActions}>
                <Button type="submit" size="large" fullWidth disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Artist Account'}
                </Button>
              </div>

              <div className={styles.formFooter}>
                <p className={styles.footerText}>
                  Already have an account?{' '}
                  <Link href="/sign-in" className={styles.footerLink}>
                    Sign In
                  </Link>
                </p>
                <p className={styles.footerText}>
                  Want to join as a client?{' '}
                  <Link href="/register/client" className={styles.footerLink}>
                    Register as Client
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className={styles.backBar}>
        <div className="container">
          <Link href={ROUTES.home} className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
