<?php

namespace App\Services;

use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

// Bikin file Excel laporan pesanan buat diunduh toko/admin.
class LaporanPesananExcel
{
    private const HEADER = [
        'Tanggal Penjualan', 'ID Pesanan', 'Toko', 'Pembeli',
        'Nama Produk', 'Jumlah', 'Harga Satuan', 'Subtotal',
        'Total Pesanan', 'Status', 'Kurir',
    ];

    /**
     * @param  Collection<int, \App\Models\Pesanan>  $pesananList  Harus sudah eager-load 'item.produk', 'toko', 'kurir', 'pembeli'.
     */
    public static function generate(Collection $pesananList, string $namaFile, string $judulSheet): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(mb_substr($judulSheet, 0, 31)); // Excel batasi nama sheet max 31 karakter

        $sheet->setCellValue('A1', $judulSheet);
        $sheet->mergeCells('A1:K1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $barisHeader = 3;
        foreach (self::HEADER as $kolom => $judul) {
            $sheet->setCellValue([$kolom + 1, $barisHeader], $judul);
        }
        $sheet->getStyle("A{$barisHeader}:K{$barisHeader}")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1D5C99']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension($barisHeader)->setRowHeight(20);

        $baris = $barisHeader + 1;
        $labelStatus = [
            'dibuat' => 'Dibuat',
            'diproses' => 'Diproses',
            'selesai' => 'Selesai',
            'dibatalkan' => 'Dibatalkan',
        ];

        foreach ($pesananList as $pesanan) {
            $namaPembeli = $pesanan->pembeli?->nama ?? $pesanan->guest_nama ?? '-';
            $items = $pesanan->item->isEmpty() ? [null] : $pesanan->item;

            foreach ($items as $item) {
                $sheet->setCellValue([1, $baris], $pesanan->created_at?->format('d/m/Y H:i'));
                $sheet->setCellValue([2, $baris], $pesanan->id);
                $sheet->setCellValue([3, $baris], $pesanan->toko?->nama_toko ?? '-');
                $sheet->setCellValue([4, $baris], $namaPembeli);
                $sheet->setCellValue([5, $baris], $item?->produk?->nama ?? '-');
                $sheet->setCellValue([6, $baris], $item?->qty ?? 0);
                $sheet->setCellValue([7, $baris], (float) ($item?->harga_satuan ?? 0));
                $sheet->setCellValue([8, $baris], (float) ($item?->subtotal ?? 0));
                $sheet->setCellValue([9, $baris], (float) $pesanan->total_harga);
                $sheet->setCellValue([10, $baris], $labelStatus[$pesanan->status] ?? $pesanan->status);
                $sheet->setCellValue([11, $baris], $pesanan->kurir?->nama_layanan ?? '-');
                $baris++;
            }
        }

        if ($baris > $barisHeader + 1) {
            $sheet->getStyle('G'.($barisHeader + 1).':I'.($baris - 1))
                ->getNumberFormat()->setFormatCode('#,##0');
        }

        // Baris ringkasan total penjualan - dihitung dari $pesananList ASLI
        // (SEBELUM di-pecah per item di atas), supaya total_harga tiap
        // pesanan cuma dihitung SEKALI per pesanan, bukan ikut kegandakan
        // sebanyak jumlah item di pesanan itu (yang akan terjadi kalau
        // tinggal menjumlahkan kolom "Total Pesanan" apa adanya, karena
        // nilai itu memang sengaja diulang di tiap baris item).
        // "Penjualan" dihitung dari pesanan berstatus SELESAI saja - pesanan
        // yang masih diproses/dibatalkan belum/tidak jadi penjualan nyata.
        $baris++; // baris kosong pemisah
        $barisRingkasan = $baris;
        $pesananSelesai = $pesananList->where('status', 'selesai');
        $totalPenjualan = $pesananSelesai->sum(fn ($p) => (float) $p->total_harga);

        $sheet->setCellValue([1, $barisRingkasan], 'Jumlah pesanan selesai');
        $sheet->mergeCells('A'.$barisRingkasan.':H'.$barisRingkasan);
        $sheet->setCellValue([9, $barisRingkasan], $pesananSelesai->count());

        $barisTotal = $barisRingkasan + 1;
        $sheet->setCellValue([1, $barisTotal], 'TOTAL PENJUALAN (pesanan selesai)');
        $sheet->mergeCells('A'.$barisTotal.':H'.$barisTotal);
        $sheet->setCellValue([9, $barisTotal], $totalPenjualan);
        $sheet->getStyle('A'.$barisTotal.':I'.$barisTotal)->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EAF4FB']],
        ]);
        $sheet->getStyle('I'.$barisRingkasan.':I'.$barisTotal)->getNumberFormat()->setFormatCode('#,##0');

        foreach (range('A', 'K') as $kolom) {
            $sheet->getColumnDimension($kolom)->setAutoSize(true);
        }
        $sheet->getStyle("A{$barisHeader}:K".($baris - 1))->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)->setColor(new Color('D1D5DB'));
        $sheet->freezePane('A'.($barisHeader + 1));

        $writer = new Xlsx($spreadsheet);

        return new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$namaFile.'"',
            'Cache-Control' => 'max-age=0',
        ]);
    }
}
