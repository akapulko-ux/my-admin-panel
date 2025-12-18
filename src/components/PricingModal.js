import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Check, Star } from 'lucide-react';

const PricingModal = ({ isOpen, onClose, t }) => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {t.pricing?.title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            {t.pricing?.subtitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Единоразовый тариф */}
          <Card className="p-6 border-2 border-blue-200 relative">
            <div className="absolute top-4 right-4">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {t.pricing?.oneTime?.badge}
              </span>
            </div>
            
            <div className="mb-4 mt-8">
              <h3 className="text-xl font-semibold mb-2">{t.pricing?.oneTime?.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{t.pricing?.oneTime?.description}</p>
              
              <div className="mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {t.pricing?.oneTime?.price}
                </div>
                <div className="text-sm text-gray-500">
                  {t.pricing?.oneTime?.priceNote}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-gray-900">{t.pricing?.oneTime?.featuresTitle}</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t.pricing?.oneTime?.features?.fullAccess}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t.pricing?.oneTime?.features?.documents}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t.pricing?.oneTime?.features?.roiCalculator}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t.pricing?.oneTime?.features?.support}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t.pricing?.oneTime?.features?.lifetime}</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                {t.pricing?.oneTime?.note}
              </div>
            </div>
          </Card>

          {/* Тариф подписки */}
          <Card className="p-6 border-2 border-orange-200 relative">
            <div className="absolute top-4 right-4 flex items-center gap-1">
              <Star className="w-4 h-4 text-orange-500" />
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {t.pricing?.subscription?.badge}
              </span>
            </div>
            
            <div className="mb-4 mt-8">
              <h3 className="text-xl font-semibold mb-2">{t.pricing?.subscription?.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{t.pricing?.subscription?.description}</p>
              
              <div className="mb-4">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {t.pricing?.subscription?.price}
                </div>
                <div className="text-sm text-gray-500">
                  {t.pricing?.subscription?.priceNote}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-gray-900">{t.pricing?.subscription?.featuresTitle}</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t.pricing?.subscription?.features?.allProperties}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t.pricing?.subscription?.features?.newListings}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t.pricing?.subscription?.features?.prioritySupport}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t.pricing?.subscription?.features?.marketUpdates}</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-500 p-3 bg-orange-50 rounded">
                {t.pricing?.subscription?.note}
              </div>
            </div>
          </Card>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">{t.pricing?.additionalInfo?.title}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h5 className="font-medium text-gray-800 mb-1">{t.pricing?.additionalInfo?.payment?.title}</h5>
              <p>{t.pricing?.additionalInfo?.payment?.description}</p>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-1">{t.pricing?.additionalInfo?.support?.title}</h5>
              <p>{t.pricing?.additionalInfo?.support?.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mt-6 space-y-4">
          <button 
            onClick={() => setIsTermsModalOpen(true)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {t.pricing?.termsLink}
          </button>
          <Button variant="outline" onClick={onClose} className="px-8">
            {t.pricing?.closeButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Модальное окно с условиями оплаты и возврата */}
    <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t.pricing?.termsTitle}
          </DialogTitle>
          <DialogDescription className="sr-only">Условия оплаты и возврата средств</DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-4 text-sm text-gray-700 leading-relaxed">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t.pricing?.terms?.payment?.title}</h3>
            <div className="space-y-2">
              <p>{t.pricing?.terms?.payment?.point1}</p>
              <p>{t.pricing?.terms?.payment?.point2}</p>
              <p>{t.pricing?.terms?.payment?.point3}</p>
              <p>{t.pricing?.terms?.payment?.point4}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t.pricing?.terms?.refund?.title}</h3>
            <div className="space-y-2">
              <p>{t.pricing?.terms?.refund?.point1}</p>
              <p>{t.pricing?.terms?.refund?.point2}</p>
              <p>{t.pricing?.terms?.refund?.point3}</p>
              <p>{t.pricing?.terms?.refund?.point4}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t.pricing?.terms?.access?.title}</h3>
            <div className="space-y-2">
              <p>{t.pricing?.terms?.access?.point1}</p>
              <p>{t.pricing?.terms?.access?.point2}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t.pricing?.terms?.liability?.title}</h3>
            <div className="space-y-2">
              <p>{t.pricing?.terms?.liability?.point1}</p>
              <p>{t.pricing?.terms?.liability?.point2}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={() => setIsTermsModalOpen(false)} className="px-8">
            {t.pricing?.closeButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default PricingModal;
