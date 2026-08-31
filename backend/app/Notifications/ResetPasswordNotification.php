<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Menggantikan notifikasi reset password bawaan Laravel yang defaultnya
 * mengarah ke route Blade. NOKA frontend-nya React terpisah, jadi link di
 * email harus mengarah ke halaman reset password di FRONTEND_URL, bukan
 * ke backend Laravel.
 */
class ResetPasswordNotification extends Notification
{
    public function __construct(public string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        // Baca langsung dari env(), BUKAN config('app.frontend_url') - supaya
        // notifikasi ini tidak bergantung sama sekali pada config/app.php
        // custom (yang ternyata berisiko kalau menimpa file bawaan Laravel).
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $url = $frontendUrl.'/reset-password?token='.$this->token.'&email='.urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject('Reset Password NOKA')
            ->greeting('Halo'.($notifiable->nama ? ', '.$notifiable->nama : '').'!')
            ->line('Kami menerima permintaan untuk reset password akun NOKA kamu.')
            ->action('Reset Password', $url)
            ->line('Link ini berlaku selama 60 menit dan hanya bisa dipakai sekali.')
            ->line('Kalau kamu tidak merasa meminta reset password, abaikan saja email ini.');
    }
}
