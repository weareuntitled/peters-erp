import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isLoading?: boolean;
}

const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, itemName, isLoading }: DeleteModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="flex items-start gap-4 p-6">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-base font-semibold text-slate-900">
                      {title}
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-slate-500">
                      {message}
                      {itemName && (
                        <span className="mt-1 block font-medium text-slate-700">"{itemName}"</span>
                      )}
                    </Dialog.Description>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="rounded bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline outline-1 outline-slate-300 disabled:opacity-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Löschen...
                      </>
                    ) : (
                      'Löschen'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DeleteModal;