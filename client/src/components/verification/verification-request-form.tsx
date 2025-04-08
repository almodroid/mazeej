import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const formSchema = z.object({
  documentType: z.string().min(1, { message: 'Document type is required' }),
  document: z.instanceof(File, { message: 'Document file is required' }),
  additionalInfo: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export function VerificationRequestForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: '',
      additionalInfo: ''
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      formData.append('documentType', data.documentType);
      formData.append('document', data.document);
      
      if (data.additionalInfo) {
        formData.append('additionalInfo', data.additionalInfo);
      }
      
      const response = await apiRequest('POST', '/api/verification-requests', formData, {
        headers: {
          // Do not set Content-Type header when using FormData
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit verification request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('verification.requestSubmitted'),
        description: t('verification.requestSubmittedDesc'),
      });
      
      // Reset form
      form.reset();
      setPreviewUrl(null);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/my-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('verification.requestError'),
        variant: 'destructive',
      });
    }
  });

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('document', file, { shouldValidate: true });
      
      // Create and set preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Clean up the URL when component unmounts
      return () => URL.revokeObjectURL(url);
    }
  };

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('verification.requestVerification')}</CardTitle>
        <CardDescription>
          {t('verification.requestDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('verification.documentType')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('verification.selectDocumentType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="id_card">{t('verification.idCard')}</SelectItem>
                      <SelectItem value="passport">{t('verification.passport')}</SelectItem>
                      <SelectItem value="driving_license">{t('verification.drivingLicense')}</SelectItem>
                      <SelectItem value="professional_certificate">{t('verification.professionalCertificate')}</SelectItem>
                      <SelectItem value="other">{t('verification.otherDocument')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('verification.documentFile')}</FormLabel>
                  <FormControl>
                    <div className="grid w-full max-w-lg items-center gap-1.5">
                      <Input
                        type="file"
                        id="document"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleDocumentChange}
                      />
                      <div className="grid grid-cols-1 gap-3">
                        <label
                          htmlFor="document"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md border-gray-300 cursor-pointer hover:border-primary"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              {t('verification.dragAndDrop')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t('verification.fileSizeLimit')}
                            </p>
                          </div>
                        </label>
                        
                        {previewUrl && (
                          <div className="mt-2 flex items-center justify-center">
                            {previewUrl.includes('pdf') ? (
                              <div className="flex items-center bg-gray-100 p-2 rounded">
                                <span className="text-sm">{field.value?.name}</span>
                              </div>
                            ) : (
                              <img 
                                src={previewUrl} 
                                alt="Document preview" 
                                className="max-h-40 max-w-full object-contain rounded" 
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('verification.additionalInfo')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('verification.additionalInfoPlaceholder')} 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.submitting')}
                </>
              ) : (
                t('verification.submitRequest')
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}