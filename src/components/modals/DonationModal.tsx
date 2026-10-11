'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { DonationForm } from '@/components/donations/DonationForm';
import { useAppStore } from '@/store';

export function GlobalDonationModal() {
  const isOpen = useAppStore((s) => s.donationModal.isOpen);
  const preselectedCountryId = useAppStore((s) => s.donationModal.preselectedCountryId);
  const closeDonationModal = useAppStore((s) => s.closeDonationModal);
  const countries = useAppStore((s) => s.countries);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDonationModal}
      title="Donar"
      description="Tu ofrenda sostiene el trabajo misionero alrededor del mundo."
      size="lg"
    >
      <DonationForm countries={countries} preselectedCountryId={preselectedCountryId} />
    </Modal>
  );
}