/*
 *
 * (c) Copyright Ascensio System Limited 2010-2018
 *
 * This program is freeware. You can redistribute it and/or modify it under the terms of the GNU 
 * General Public License (GPL) version 3 as published by the Free Software Foundation (https://www.gnu.org/copyleft/gpl.html). 
 * In accordance with Section 7(a) of the GNU GPL its Section 15 shall be amended to the effect that 
 * Ascensio System SIA expressly excludes the warranty of non-infringement of any third-party rights.
 *
 * THIS PROGRAM IS DISTRIBUTED WITHOUT ANY WARRANTY; WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR
 * FITNESS FOR A PARTICULAR PURPOSE. For more details, see GNU GPL at https://www.gnu.org/copyleft/gpl.html
 *
 * You can contact Ascensio System SIA by email at sales@onlyoffice.com
 *
 * The interactive user interfaces in modified source and object code versions of ONLYOFFICE must display 
 * Appropriate Legal Notices, as required under Section 5 of the GNU GPL version 3.
 *
 * Pursuant to Section 7 § 3(b) of the GNU GPL you must retain the original ONLYOFFICE logo which contains 
 * relevant author attributions when distributing the software. If the display of the logo in its graphic 
 * form is not reasonably feasible for technical reasons, you must include the words "Powered by ONLYOFFICE" 
 * in every copy of the program you distribute. 
 * Pursuant to Section 7 § 3(e) we decline to grant you any rights under trademark law for use of our trademarks.
 *
*/


using System;
using System.Collections.Generic;
using System.Linq;
using System.Security;

using ASC.Common;
using ASC.Core.Billing;
using ASC.Core.Caching;
using ASC.Core.Data;
using ASC.Core.Security.Authentication;
using ASC.Core.Tenants;
using ASC.Core.Users;
using ASC.Security.Cryptography;

using Microsoft.Extensions.Options;

namespace ASC.Core
{
    class ConfigureHostedSolution : IConfigureNamedOptions<HostedSolution>
    {
        public UserFormatter UserFormatter { get; }
        public IOptionsSnapshot<CachedTenantService> TenantService { get; }
        public IOptionsSnapshot<CachedUserService> UserService { get; }
        public IOptionsSnapshot<CachedQuotaService> QuotaService { get; }
        public IOptionsSnapshot<TariffService> TariffService { get; }
        public IOptionsSnapshot<TenantManager> TenantManager { get; }
        public IOptionsSnapshot<TenantUtil> TenantUtil { get; }
        public IOptionsSnapshot<DbSettingsManager> DbSettingsManager { get; }
        public IOptionsSnapshot<CoreSettings> CoreSettings { get; }

        public ConfigureHostedSolution(
            UserFormatter userFormatter,
            IOptionsSnapshot<CachedTenantService> tenantService,
            IOptionsSnapshot<CachedUserService> userService,
            IOptionsSnapshot<CachedQuotaService> quotaService,
            IOptionsSnapshot<TariffService> tariffService,
            IOptionsSnapshot<TenantManager> tenantManager,
            IOptionsSnapshot<TenantUtil> tenantUtil,
            IOptionsSnapshot<DbSettingsManager> dbSettingsManager,
            IOptionsSnapshot<CoreSettings> coreSettings
            )
        {
            UserFormatter = userFormatter;
            TenantService = tenantService;
            UserService = userService;
            QuotaService = quotaService;
            TariffService = tariffService;
            TenantManager = tenantManager;
            TenantUtil = tenantUtil;
            DbSettingsManager = dbSettingsManager;
            CoreSettings = coreSettings;
        }

        public void Configure(HostedSolution hostedSolution)
        {
            hostedSolution.UserFormatter = UserFormatter;
            hostedSolution.TenantService = TenantService.Value;
            hostedSolution.UserService = UserService.Value;
            hostedSolution.QuotaService = QuotaService.Value;
            hostedSolution.TariffService = TariffService.Value;
            hostedSolution.ClientTenantManager = TenantManager.Value;
            hostedSolution.TenantUtil = TenantUtil.Value;
            hostedSolution.SettingsManager = DbSettingsManager.Value;
            hostedSolution.CoreSettings = CoreSettings.Value;
        }

        public void Configure(string name, HostedSolution hostedSolution)
        {
            Configure(hostedSolution);
            hostedSolution.Region = name;
            hostedSolution.TenantService = TenantService.Get(name);
            hostedSolution.UserService = UserService.Get(name);
            hostedSolution.QuotaService = QuotaService.Get(name);
            hostedSolution.TariffService = TariffService.Get(name);
            hostedSolution.ClientTenantManager = TenantManager.Get(name);
            hostedSolution.TenantUtil = TenantUtil.Get(name);
            hostedSolution.SettingsManager = DbSettingsManager.Get(name);
            hostedSolution.CoreSettings = CoreSettings.Get(name);
        }
    }

    public class HostedSolution
    {
        internal ITenantService TenantService { get; set; }
        internal IUserService UserService { get; set; }
        internal IQuotaService QuotaService { get; set; }
        internal ITariffService TariffService { get; set; }
        internal UserFormatter UserFormatter { get; set; }
        internal TenantManager ClientTenantManager { get; set; }
        internal TenantUtil TenantUtil { get; set; }
        internal DbSettingsManager SettingsManager { get; set; }
        internal CoreSettings CoreSettings { get; set; }

        public string Region { get; set; }

        public HostedSolution()
        {

        }

        public List<Tenant> GetTenants(DateTime from)
        {
            return TenantService.GetTenants(from).Select(AddRegion).ToList();
        }

        public List<Tenant> FindTenants(string login)
        {
            return FindTenants(login, null);
        }

        public List<Tenant> FindTenants(string login, string password)
        {
            var hash = !string.IsNullOrEmpty(password) ? Hasher.Base64Hash(password, HashAlg.SHA256) : null;
            if (hash != null && UserService.GetUser(Tenant.DEFAULT_TENANT, login, hash) == null)
            {
                throw new SecurityException("Invalid login or password.");
            }
            return TenantService.GetTenants(login, hash).Select(AddRegion).ToList();
        }

        public Tenant GetTenant(string domain)
        {
            return AddRegion(TenantService.GetTenant(domain));
        }

        public Tenant GetTenant(int id)
        {
            return AddRegion(TenantService.GetTenant(id));
        }

        public void CheckTenantAddress(string address)
        {
            TenantService.ValidateDomain(address);
        }

        public void RegisterTenant(TenantRegistrationInfo ri, out Tenant tenant)
        {
            if (ri == null) throw new ArgumentNullException("registrationInfo");
            if (string.IsNullOrEmpty(ri.Address)) throw new Exception("Address can not be empty");

            if (string.IsNullOrEmpty(ri.Email)) throw new Exception("Account email can not be empty");
            if (ri.FirstName == null) throw new Exception("Account firstname can not be empty");
            if (ri.LastName == null) throw new Exception("Account lastname can not be empty");
            if (!UserFormatter.IsValidUserName(ri.FirstName, ri.LastName)) throw new Exception("Incorrect firstname or lastname");

            if (string.IsNullOrEmpty(ri.Password)) ri.Password = Crypto.GeneratePassword(6);

            // create tenant
            tenant = new Tenant(ri.Address.ToLowerInvariant())
            {
                Name = ri.Name,
                Language = ri.Culture.Name,
                TimeZone = ri.TimeZoneInfo.Id,
                HostedRegion = ri.HostedRegion,
                PartnerId = ri.PartnerId,
                AffiliateId = ri.AffiliateId,
                Campaign = ri.Campaign,
                Industry = ri.Industry,
                Spam = ri.Spam,
                Calls = ri.Calls
            };

            tenant = TenantService.SaveTenant(CoreSettings, tenant);

            // create user
            var user = new UserInfo
            {
                UserName = ri.Email.Substring(0, ri.Email.IndexOf('@')),
                LastName = ri.LastName,
                FirstName = ri.FirstName,
                Email = ri.Email,
                MobilePhone = ri.MobilePhone,
                WorkFromDate = TenantUtil.DateTimeNow(tenant.TimeZone),
                ActivationStatus = ri.ActivationStatus
            };
            user = UserService.SaveUser(tenant.TenantId, user);
            UserService.SetUserPassword(tenant.TenantId, user.ID, ri.Password);
            UserService.SaveUserGroupRef(tenant.TenantId, new UserGroupRef(user.ID, Constants.GroupAdmin.ID, UserGroupRefType.Contains));

            // save tenant owner
            tenant.OwnerId = user.ID;
            tenant = TenantService.SaveTenant(CoreSettings, tenant);

            SettingsManager.SaveSettings(new TenantAnalyticsSettings() { Analytics = ri.Analytics }, tenant.TenantId);
        }

        public Tenant SaveTenant(Tenant tenant)
        {
            return TenantService.SaveTenant(CoreSettings, tenant);
        }

        public void RemoveTenant(Tenant tenant)
        {
            TenantService.RemoveTenant(tenant.TenantId);
        }

        public string CreateAuthenticationCookie(CookieStorage cookieStorage, int tenantId, string login, string password)
        {
            var passwordhash = Hasher.Base64Hash(password, HashAlg.SHA256);
            var u = UserService.GetUser(tenantId, login, passwordhash);
            return u != null ? CreateAuthenticationCookie(cookieStorage, tenantId, u.ID, login, passwordhash) : null;
        }

        public string CreateAuthenticationCookie(CookieStorage cookieStorage, int tenantId, Guid userId)
        {
            var u = UserService.GetUser(tenantId, userId);
            var password = UserService.GetUserPassword(tenantId, userId);
            var passwordhash = Hasher.Base64Hash(password, HashAlg.SHA256);
            return u != null ? CreateAuthenticationCookie(cookieStorage, tenantId, userId, u.Email, passwordhash) : null;
        }

        private string CreateAuthenticationCookie(CookieStorage cookieStorage, int tenantId, Guid userId, string login, string passwordhash)
        {
            var tenantSettings = SettingsManager.LoadSettingsFor<TenantCookieSettings>(tenantId, Guid.Empty);
            var expires = tenantSettings.IsDefault() ? DateTime.UtcNow.AddYears(1) : DateTime.UtcNow.AddMinutes(tenantSettings.LifeTime);
            var userSettings = SettingsManager.LoadSettingsFor<TenantCookieSettings>(tenantId, userId);
            return cookieStorage.EncryptCookie(tenantId, userId, login, passwordhash, tenantSettings.Index, expires, userSettings.Index);
        }

        public Tariff GetTariff(int tenant, bool withRequestToPaymentSystem = true)
        {
            return TariffService.GetTariff(tenant, withRequestToPaymentSystem);
        }

        public TenantQuota GetTenantQuota(int tenant)
        {
            return ClientTenantManager.GetTenantQuota(tenant);
        }

        public IEnumerable<TenantQuota> GetTenantQuotas()
        {
            return ClientTenantManager.GetTenantQuotas();
        }

        public TenantQuota SaveTenantQuota(TenantQuota quota)
        {
            return ClientTenantManager.SaveTenantQuota(quota);
        }

        public void SetTariff(int tenant, bool paid)
        {
            var quota = QuotaService.GetTenantQuotas().FirstOrDefault(q => paid ? q.NonProfit : q.Trial);
            if (quota != null)
            {
                TariffService.SetTariff(tenant, new Tariff { QuotaId = quota.Id, DueDate = DateTime.MaxValue, });
            }
        }

        public void SetTariff(int tenant, Tariff tariff)
        {
            TariffService.SetTariff(tenant, tariff);
        }

        public void SaveButton(int tariffId, string partnerId, string buttonUrl)
        {
            TariffService.SaveButton(tariffId, partnerId, buttonUrl);
        }


        private Tenant AddRegion(Tenant tenant)
        {
            if (tenant != null)
            {
                tenant.HostedRegion = Region;
            }
            return tenant;
        }
    }

    public static class HostedSolutionExtension
    {
        public static DIHelper AddHostedSolutionService(this DIHelper services)
        {
            services.TryAddScoped<IConfigureOptions<HostedSolution>, ConfigureHostedSolution>();

            return services
                .AddUserFormatter()
                .AddTenantService()
                .AddUserService()
                .AddQuotaService()
                .AddTariffService()
                .AddTenantManagerService()
                .AddTenantUtilService()
                .AddDbSettingsManagerService()
                .AddCoreSettingsService();
        }
    }
}