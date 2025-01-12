INSERT INTO public.llm_model ("name", "type", "costPerInputToken", "costPerOutputToken", "costMultiplier") 
VALUES ('gpt-4o-mini', 'chat', 30, 120, 100000000);

INSERT INTO public.llm_model ("name", "type", "costPerInputToken", "costPerOutputToken", "costMultiplier") 
VALUES ('dall-e-3', 'image', 6, 6, 100);

INSERT INTO public.currency ("name", "isoCode", "toBaseCurrencyMultiplier")
VALUES ('Botswana Pula', 'BWP', 13.71);