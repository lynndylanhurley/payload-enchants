import { useModal } from '@payloadcms/ui/elements/Modal';
import { useAllFormFields } from '@payloadcms/ui/forms/Form';
import { useConfig } from '@payloadcms/ui/providers/Config';
import { useDocumentInfo } from '@payloadcms/ui/providers/DocumentInfo';
import { useLocale } from '@payloadcms/ui/providers/Locale';
import { useTranslation } from '@payloadcms/ui/providers/Translation';
import { getFormState } from '@payloadcms/ui/utilities/getFormState';
import { reduceFieldsToValuesWithValidation } from '@payloadcms/ui/utilities/reduceFieldsToValuesWithValidation';
import { type ReactNode, useMemo, useState } from 'react';
import { toast } from 'react-toastify'

import type { TranslateResolver } from '../../../resolvers/types';
import type { TranslateArgs } from '../../../translate/types';
import { createClient } from '../../api';
import { TranslatorContext } from './context';

const modalSlug = 'translator-modal';

export const TranslatorProvider = ({ children }: { children: ReactNode }) => {
  const [resolver, setResolver] = useState<null | string>(null);

  const [data, dispatch] = useAllFormFields();

  const { collectionSlug, globalSlug, id } = useDocumentInfo();

  const modal = useModal();

  const { t } = useTranslation();

  const resolverT = (
    key:
      | 'buttonLabel'
      | 'errorMessage'
      | 'modalTitle'
      | 'submitButtonLabelEmpty'
      | 'submitButtonLabelFull'
      | 'successMessage',
  ) => {
    if (!resolver) return '';

    return t(`plugin-translator:resolver_${resolver}_${key}` as Parameters<typeof t>[0]);
  };

  const locale = useLocale();

  const {
    config: {
      admin: { custom },
      localization,
      routes: { api },
      serverURL,
    }
  } = useConfig();

  const apiClient = createClient({ api, serverURL });

  const resolverConfig = useMemo(() => {
    if (!resolver) return null;

    const resolvers = (custom?.translator?.resolvers as TranslateResolver[]) || undefined;

    if (!resolvers) return null;

    const resolverConfig = resolvers.find((each) => each.key === resolver);

    return resolverConfig ?? null;
  }, [custom, resolver]);

  if (!localization)
    throw new Error('Localization config is not provided and PluginTranslator is used');

  const localesOptions = localization.locales.filter((each) => each.code !== locale.code);

  const [localeToTranslateFrom, setLocaleToTranslateFrom] = useState(() => {
    const defaultFromOptions = localesOptions.find(
      (each) => localization.defaultLocale === each.code,
    );

    if (defaultFromOptions) return defaultFromOptions.code;

    return localesOptions[0].code;
  });

  const closeTranslator = () => modal.closeModal(modalSlug);

  const submit = async ({ emptyOnly }: { emptyOnly: boolean }) => {
    if (!resolver) return;

    const args: TranslateArgs = {
      collectionSlug,
      data: reduceFieldsToValuesWithValidation(data, true),
      emptyOnly,
      globalSlug,
      id: id === null ? undefined : id,
      locale: locale.code,
      localeFrom: localeToTranslateFrom,
      resolver,
    };

    const result = await apiClient.translate(args);

    if (!result.success) {
      toast.error(resolverT('errorMessage'));

      return;
    }

    dispatch({
      state: await getFormState({
        apiRoute: api,
        body: {
          collectionSlug,
          data: result.translatedData,
          globalSlug,
          locale: locale.code,
          schemaPath: collectionSlug || globalSlug || '',
        },
        serverURL,
      }),
      type: 'REPLACE_STATE',
    });

    if (resolverConfig) toast.success(resolverT('successMessage'));
    closeTranslator();
  };

  return (
    <TranslatorContext.Provider
      value={{
        closeTranslator,
        localeToTranslateFrom,
        localesOptions,
        modalSlug,
        openTranslator: ({ resolverKey }) => {
          setResolver(resolverKey);
          modal.openModal(modalSlug);
        },
        resolver: resolverConfig,
        resolverT,
        setLocaleToTranslateFrom,
        submit,
      }}
    >
      {children}
    </TranslatorContext.Provider>
  );
};
