import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export const Contact: React.FC = () => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('contact.errors.name');
    if (!formData.email.trim()) {
      newErrors.email = t('contact.errors.email');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('contact.errors.emailInvalid');
    }
    if (!formData.subject.trim()) newErrors.subject = t('contact.errors.subject');
    if (!formData.message.trim()) newErrors.message = t('contact.errors.message');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitStatus('loading');

    // Simulate API call
    setTimeout(() => {
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <section id="contact" className="py-24 bg-secondary-bg border-t border-custom-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-accent mb-2 block">
            {t('contact.subtitle')}
          </span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-primary-text font-display">
            {t('contact.title')}
          </h2>
          <div className="w-12 h-[1px] bg-accent mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-primary-bg border border-custom-border p-8 rounded-3xl shadow-sm">
            <h3 className="text-lg font-bold uppercase tracking-wider text-primary-text mb-6">
              {t('contact.form.title')}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Name */}
              <div>
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-primary-text mb-2 block">
                  {t('contact.form.name')}
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 text-sm bg-secondary-bg border ${
                    errors.name ? 'border-error' : 'border-custom-border'
                  } rounded-lg text-primary-text focus:outline-none focus:border-accent transition-colors`}
                  placeholder={t('contact.form.placeholderName')}
                />
                {errors.name && <span className="text-xs text-error mt-1 block">{errors.name}</span>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-primary-text mb-2 block">
                  {t('contact.form.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 text-sm bg-secondary-bg border ${
                    errors.email ? 'border-error' : 'border-custom-border'
                  } rounded-lg text-primary-text focus:outline-none focus:border-accent transition-colors`}
                  placeholder={t('contact.form.placeholderEmail')}
                />
                {errors.email && <span className="text-xs text-error mt-1 block">{errors.email}</span>}
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest text-primary-text mb-2 block">
                  {t('contact.form.subject')}
                </label>
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 text-sm bg-secondary-bg border ${
                    errors.subject ? 'border-error' : 'border-custom-border'
                  } rounded-lg text-primary-text focus:outline-none focus:border-accent transition-colors`}
                  placeholder={t('contact.form.placeholderSubject')}
                />
                {errors.subject && <span className="text-xs text-error mt-1 block">{errors.subject}</span>}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-primary-text mb-2 block">
                  {t('contact.form.message')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 text-sm bg-secondary-bg border ${
                    errors.message ? 'border-error' : 'border-custom-border'
                  } rounded-lg text-primary-text focus:outline-none focus:border-accent transition-colors resize-none`}
                  placeholder={t('contact.form.placeholderMessage')}
                />
                {errors.message && <span className="text-xs text-error mt-1 block">{errors.message}</span>}
              </div>

              {/* Submission State UI */}
              {submitStatus === 'success' && (
                <div className="flex items-center gap-2 text-success bg-success/10 border border-success/20 p-3 rounded-lg text-sm">
                  <CheckCircle2 size={16} />
                  {t('contact.form.success')}
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="flex items-center gap-2 text-error bg-error/10 border border-error/20 p-3 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  {t('contact.form.error')}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitStatus === 'loading'}
                className="text-xs font-semibold tracking-widest uppercase bg-accent text-black px-8 py-3.5 hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {submitStatus === 'loading' ? (
                  <>{t('contact.form.sending')}</>
                ) : (
                  <>
                    <Send size={14} />
                    {t('contact.form.btnSend')}
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Right Column: Contact info & Google Maps */}
          <div className="lg:col-span-5 flex flex-col gap-6 w-full">
            
            {/* Quick info card */}
            <div className="bg-primary-bg border border-custom-border p-8 rounded-3xl shadow-sm flex flex-col gap-6">
              <h3 className="text-lg font-bold uppercase tracking-wider text-primary-text">
                {t('contact.details.title')}
              </h3>
              
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-accent/10 rounded-lg text-accent">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-text mb-0.5">{t('contact.details.email')}</h4>
                    <p className="text-sm text-secondary-text">{t('contact.details.emailVal')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-accent/10 rounded-lg text-accent">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-text mb-0.5">{t('contact.details.phone')}</h4>
                    <p className="text-sm text-secondary-text">{t('contact.details.phoneVal')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-accent/10 rounded-lg text-accent">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-text mb-0.5">{t('contact.details.location')}</h4>
                    <p className="text-sm text-secondary-text">{t('contact.details.locationVal')}</p>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="border-t border-custom-border pt-6 flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-1">{t('contact.details.follow')}</h4>
                <div className="flex gap-4">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-secondary-bg hover:bg-accent border border-custom-border text-secondary-text hover:text-white rounded-full transition-colors" aria-label="GitHub">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                      <path d="M9 18c-4.51 2-5-2-7-2" />
                    </svg>
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-secondary-bg hover:bg-accent border border-custom-border text-secondary-text hover:text-white rounded-full transition-colors" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </a>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-secondary-bg hover:bg-accent border border-custom-border text-secondary-text hover:text-white rounded-full transition-colors" aria-label="Facebook">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden border border-custom-border bg-primary-bg shadow-sm">
              <iframe
                title="Google Map Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.95434483879!2d106.69436667584024!3d10.734255559897148!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f40a3b49e59%3A0x24c3057dbaf17d6!2zUXXhuq1uIDcsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
export default Contact;
