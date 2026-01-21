-- Add help link visibility settings to app_settings table
INSERT INTO app_settings (key, value, description)
VALUES
  ('help_show_documentation', 'true', 'Vis lenke til dokumentasjon i Wedflow Support'),
  ('help_show_faq', 'true', 'Vis lenke til FAQ i Wedflow Support'),
  ('help_show_videoguides', 'false', 'Vis lenke til videoguider i Wedflow Support'),
  ('help_show_whatsnew', 'true', 'Vis lenke til Hva er nytt-funksjonen i Wedflow Support'),
  ('help_show_status', 'true', 'Vis lenke til systemstatus i Wedflow Support'),
  ('help_show_email_support', 'false', 'Vis lenke til e-post support i Wedflow Support'),
  ('help_show_norwedfilm', 'true', 'Vis lenke til Norwedfilm i Wedflow Support')
ON CONFLICT (key) DO NOTHING;
