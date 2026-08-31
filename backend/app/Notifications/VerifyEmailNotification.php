<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

/**
 * Menggantikan notifikasi verifikasi email bawaan Laravel. Link mengarah ke
 * endpoint backend Laravel (route bertanda tangan/signed, expire 60 menit) -
 * BUKAN ke halaman React - karena verifikasi harus diproses backend
 * (menandai email_verified_at) sebelum user diarahkan balik ke frontend.
 */
class VerifyEmailNotification extends Notification
{
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        return (new MailMessage)
            ->subject('Verifikasi Email NOKA')
            ->greeting('Halo'.($notifiable->nama ? ', '.$notifiable->nama : '').'!')
            ->line('Terima kasih sudah daftar di NOKA. Verifikasi dulu email kamu supaya bisa login.')
            ->action('Verifikasi Email', $url)
            ->line('Link ini berlaku selama 60 menit dan hanya bisa dipakai sekali.')
            ->line('Kalau kamu tidak merasa daftar di NOKA, abaikan saja email ini.');
    }
}
