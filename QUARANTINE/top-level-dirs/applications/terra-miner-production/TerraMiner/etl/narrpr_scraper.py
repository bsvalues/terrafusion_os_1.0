import os
import time
import logging
import pandas as pd
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager

# Configure logger
logger = logging.getLogger(__name__)

class NarrprScraper:
    """
    A class to handle login and data scraping from the NARRPR website.
    """
    
    def __init__(self, username, password, headless=True):
        """
        Initialize the NarrprScraper with credentials.
        
        Args:
            username (str): NARRPR account username/email
            password (str): NARRPR account password
            headless (bool): Whether to run the browser in headless mode
        """
        self.username = username
        self.password = password
        self.base_url = "https://www.narrpr.com"
        self.driver = None
        self.headless = headless
        self.is_logged_in = False
        self.setup_driver()
    
    def setup_driver(self):
        """Configure and initialize the Selenium WebDriver."""
        try:
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument("--headless")
            
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--window-size=1920,1080")
            
            # Initialize the driver
            self.driver = webdriver.Chrome(
                service=Service(ChromeDriverManager().install()),
                options=chrome_options
            )
            self.driver.implicitly_wait(10)
            logger.info("WebDriver initialized successfully")
            
        except WebDriverException as e:
            logger.error(f"Failed to initialize WebDriver: {str(e)}")
            raise
    
    def login(self):
        """
        Log in to the NARRPR website.
        
        Returns:
            bool: True if login successful, False otherwise
        """
        try:
            logger.info("Attempting to login to NARRPR")
            self.driver.get(f"{self.base_url}/home")
            
            # Wait for login form to appear
            username_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "login-email"))
            )
            password_field = self.driver.find_element(By.ID, "login-password")
            login_button = self.driver.find_element(By.ID, "login-button")
            
            # Enter credentials
            username_field.clear()
            username_field.send_keys(self.username)
            password_field.clear()
            password_field.send_keys(self.password)
            
            # Click login button
            login_button.click()
            
            # Wait for login to complete and verify
            time.sleep(5)  # Allow time for redirection
            
            # Check if login successful by looking for dashboard in URL
            if "dashboard" in self.driver.current_url:
                logger.info("Login successful")
                self.is_logged_in = True
                # Save cookies for session management
                self.cookies = self.driver.get_cookies()
                return True
            else:
                logger.error("Login failed - dashboard not found in URL")
                self.is_logged_in = False
                return False
                
        except TimeoutException:
            logger.error("Login timed out - elements not found within time limit")
            return False
        except NoSuchElementException as e:
            logger.error(f"Login failed - element not found: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Login failed with unexpected error: {str(e)}")
            return False
    
    def restore_session(self):
        """
        Restore a previous session using saved cookies.
        
        Returns:
            bool: True if session restored successfully, False otherwise
        """
        if not hasattr(self, 'cookies') or not self.cookies:
            logger.warning("No saved cookies found to restore session")
            return False
        
        try:
            self.driver.get(self.base_url)
            
            # Add saved cookies
            for cookie in self.cookies:
                self.driver.add_cookie(cookie)
            
            # Verify session by navigating to dashboard
            self.driver.get(f"{self.base_url}/dashboard")
            time.sleep(3)
            
            # Check if still logged in
            if "dashboard" in self.driver.current_url:
                logger.info("Session restored successfully")
                self.is_logged_in = True
                return True
            else:
                logger.warning("Failed to restore session - needs new login")
                return self.login()
                
        except Exception as e:
            logger.error(f"Error restoring session: {str(e)}")
            return False
    
    def check_login_status(self):
        """
        Check if the current session is still logged in.
        
        Returns:
            bool: True if still logged in, False otherwise
        """
        if not self.is_logged_in:
            return False
            
        try:
            # Try accessing a protected page
            self.driver.get(f"{self.base_url}/dashboard")
            time.sleep(2)
            
            # Check if redirected to login page
            if "login" in self.driver.current_url:
                logger.warning("Session expired - need to login again")
                self.is_logged_in = False
                return self.login()
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking login status: {str(e)}")
            self.is_logged_in = False
            return False
    
    def check_login_status(self):
        """
        Check if the scraper is currently logged in.
        
        Returns:
            bool: True if logged in, False otherwise
        """
        if self.is_logged_in:
            # Verify login status by checking current URL or cookies
            try:
                # Get current page to check login status
                current_url = self.driver.current_url
                
                # If we're already on a NARRPR page, just check if we're logged in
                if self.base_url in current_url:
                    if "login" in current_url.lower():
                        self.is_logged_in = False
                    elif "dashboard" in current_url.lower() or "reports" in current_url.lower():
                        self.is_logged_in = True
                else:
                    # Navigate to home page to check login status
                    self.driver.get(f"{self.base_url}/home")
                    time.sleep(3)  # Wait for page to load
                    
                    # Check if we were redirected to login
                    if "login" in self.driver.current_url.lower():
                        self.is_logged_in = False
                    else:
                        self.is_logged_in = True
                
                return self.is_logged_in
                
            except Exception as e:
                logger.error(f"Error checking login status: {str(e)}")
                return False
        else:
            return False
    
    def scrape_property_details(self, property_id):
        """
        Scrape details for a specific property.
        
        Args:
            property_id (str): Property ID in NARRPR
            
        Returns:
            dict: Dictionary containing property details
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot scrape property details.")
            return {}
        
        try:
            logger.info(f"Navigating to property details page for property ID: {property_id}")
            self.driver.get(f"{self.base_url}/property/{property_id}")
            
            # Wait for property details to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "property-details"))
            )
            
            # Extract property data
            property_data = {
                'property_id': property_id,
                'address': {},
                'property_type': '',
                'beds': None,
                'baths': None,
                'square_feet': None,
                'year_built': None,
                'lot_size': None,
                'estimated_value': None
            }
            
            # Extract address
            try:
                address_element = self.driver.find_element(By.CLASS_NAME, "property-address")
                full_address = address_element.text
                address_parts = full_address.split(',')
                
                property_data['address']['full_address'] = full_address
                property_data['address']['street'] = address_parts[0].strip() if len(address_parts) > 0 else ''
                
                if len(address_parts) > 1:
                    city_state_zip = address_parts[1].strip().split(' ')
                    property_data['address']['city'] = ' '.join(city_state_zip[:-2]).strip() if len(city_state_zip) > 2 else ''
                    property_data['address']['state'] = city_state_zip[-2].strip() if len(city_state_zip) > 1 else ''
                    property_data['address']['zip_code'] = city_state_zip[-1].strip() if len(city_state_zip) > 0 else ''
            except Exception as e:
                logger.warning(f"Error extracting address: {str(e)}")
            
            # Extract property details
            try:
                # Extract property type
                property_type_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'property-type')]")
                property_data['property_type'] = property_type_element.text.strip()
            except Exception:
                logger.warning("Property type not found")
                
            # Extract beds, baths, square feet
            try:
                specs_elements = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'property-specs')]/div")
                for spec in specs_elements:
                    spec_text = spec.text.lower()
                    
                    if 'bed' in spec_text:
                        try:
                            property_data['beds'] = float(spec_text.split()[0])
                        except (ValueError, IndexError):
                            pass
                    elif 'bath' in spec_text:
                        try:
                            property_data['baths'] = float(spec_text.split()[0])
                        except (ValueError, IndexError):
                            pass
                    elif 'sq ft' in spec_text or 'sqft' in spec_text:
                        try:
                            # Remove commas and convert to integer
                            sqft_text = spec_text.split()[0].replace(',', '')
                            property_data['square_feet'] = int(sqft_text)
                        except (ValueError, IndexError):
                            pass
            except Exception as e:
                logger.warning(f"Error extracting property specs: {str(e)}")
                
            # Extract year built and lot size
            try:
                details_elements = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'property-details-section')]//div[@class='detail-item']")
                for detail in details_elements:
                    detail_text = detail.text.lower()
                    
                    if 'year built' in detail_text:
                        try:
                            property_data['year_built'] = int(detail_text.split(':')[1].strip())
                        except (ValueError, IndexError):
                            pass
                    elif 'lot size' in detail_text:
                        try:
                            lot_size_text = detail_text.split(':')[1].strip()
                            # Extract numeric value, assuming it's in acres
                            property_data['lot_size'] = float(lot_size_text.split()[0].replace(',', ''))
                        except (ValueError, IndexError):
                            pass
            except Exception as e:
                logger.warning(f"Error extracting additional property details: {str(e)}")
                
            # Extract estimated value
            try:
                value_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'estimated-value')]")
                value_text = value_element.text.strip().replace('$', '').replace(',', '')
                property_data['estimated_value'] = int(value_text)
            except Exception:
                logger.warning("Estimated value not found")
                
            return property_data
            
        except TimeoutException:
            logger.error("Timed out waiting for property details to load")
            return {}
        except Exception as e:
            logger.error(f"Error scraping property details: {str(e)}")
            return {}
    
    def scrape_property_valuations(self, property_id):
        """
        Scrape valuation data for a specific property.
        
        Args:
            property_id (str): Property ID in NARRPR
            
        Returns:
            dict: Dictionary containing property valuation data
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot scrape property valuations.")
            return {}
        
        try:
            logger.info(f"Navigating to property valuation page for property ID: {property_id}")
            self.driver.get(f"{self.base_url}/property/{property_id}/valuation")
            
            # Wait for valuation data to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "valuation-section"))
            )
            
            # Extract valuation data
            valuation_data = {
                'property_id': property_id,
                'estimated_value': None,
                'value_range_low': None,
                'value_range_high': None,
                'confidence_score': None,
                'valuation_date': None,
                'historical_values': []
            }
            
            # Extract current valuation
            try:
                current_value_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'current-value')]")
                value_text = current_value_element.text.strip().replace('$', '').replace(',', '')
                valuation_data['estimated_value'] = int(value_text)
            except Exception as e:
                logger.warning(f"Error extracting current value: {str(e)}")
                
            # Extract value range
            try:
                range_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'value-range')]")
                range_text = range_element.text.strip()
                
                # Extract low and high values from range text like "$300,000 - $350,000"
                range_parts = range_text.split('-')
                if len(range_parts) == 2:
                    low_text = range_parts[0].strip().replace('$', '').replace(',', '')
                    high_text = range_parts[1].strip().replace('$', '').replace(',', '')
                    
                    valuation_data['value_range_low'] = int(low_text)
                    valuation_data['value_range_high'] = int(high_text)
            except Exception as e:
                logger.warning(f"Error extracting value range: {str(e)}")
                
            # Extract confidence score
            try:
                confidence_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'confidence-score')]")
                confidence_text = confidence_element.text.strip().replace('%', '')
                valuation_data['confidence_score'] = int(confidence_text)
            except Exception as e:
                logger.warning(f"Error extracting confidence score: {str(e)}")
                
            # Extract valuation date
            try:
                date_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'valuation-date')]")
                valuation_data['valuation_date'] = date_element.text.strip()
            except Exception as e:
                logger.warning(f"Error extracting valuation date: {str(e)}")
                
            # Extract historical values
            try:
                history_elements = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'valuation-history')]/div[@class='history-item']")
                
                for item in history_elements:
                    try:
                        date_element = item.find_element(By.XPATH, ".//div[@class='history-date']")
                        value_element = item.find_element(By.XPATH, ".//div[@class='history-value']")
                        
                        history_date = date_element.text.strip()
                        history_value_text = value_element.text.strip().replace('$', '').replace(',', '')
                        history_value = int(history_value_text)
                        
                        valuation_data['historical_values'].append({
                            'date': history_date,
                            'value': history_value
                        })
                    except Exception as e:
                        logger.warning(f"Error extracting historical value item: {str(e)}")
            except Exception as e:
                logger.warning(f"Error extracting historical values: {str(e)}")
                
            return valuation_data
            
        except TimeoutException:
            logger.error("Timed out waiting for property valuation data to load")
            return {}
        except Exception as e:
            logger.error(f"Error scraping property valuations: {str(e)}")
            return {}
    
    def scrape_comparable_properties(self, property_id):
        """
        Scrape comparable properties data for a specific property.
        
        Args:
            property_id (str): Property ID in NARRPR
            
        Returns:
            list: List of dictionaries containing comparable properties data
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot scrape comparable properties.")
            return []
        
        try:
            logger.info(f"Navigating to comparable properties page for property ID: {property_id}")
            self.driver.get(f"{self.base_url}/property/{property_id}/comparables")
            
            # Wait for comparables data to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "comparables-section"))
            )
            
            # Extract comparables data
            comparables_data = []
            comparable_items = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'comparable-item')]")
            
            logger.info(f"Found {len(comparable_items)} comparable properties")
            
            for item in comparable_items:
                try:
                    comparable = {
                        'id': '',
                        'address': '',
                        'distance': None,
                        'price': None,
                        'beds': None,
                        'baths': None,
                        'square_feet': None,
                        'year_built': None,
                        'sale_date': None
                    }
                    
                    # Extract ID (if available)
                    try:
                        id_element = item.find_element(By.XPATH, ".//div[@class='comparable-id']")
                        comparable['id'] = id_element.text.strip()
                    except NoSuchElementException:
                        # Try to extract from a data attribute or URL
                        try:
                            href_attr = item.find_element(By.TAG_NAME, "a").get_attribute("href")
                            if href_attr and '/property/' in href_attr:
                                comparable['id'] = href_attr.split('/property/')[1].split('/')[0]
                        except:
                            pass
                    
                    # Extract address
                    try:
                        address_element = item.find_element(By.XPATH, ".//div[contains(@class, 'comparable-address')]")
                        comparable['address'] = address_element.text.strip()
                    except NoSuchElementException:
                        pass
                        
                    # Extract distance
                    try:
                        distance_element = item.find_element(By.XPATH, ".//div[contains(@class, 'comparable-distance')]")
                        distance_text = distance_element.text.strip().replace('miles', '').strip()
                        comparable['distance'] = float(distance_text)
                    except (NoSuchElementException, ValueError):
                        pass
                        
                    # Extract price
                    try:
                        price_element = item.find_element(By.XPATH, ".//div[contains(@class, 'comparable-price')]")
                        price_text = price_element.text.strip().replace('$', '').replace(',', '')
                        comparable['price'] = int(price_text)
                    except (NoSuchElementException, ValueError):
                        pass
                        
                    # Extract other details
                    try:
                        details_elements = item.find_elements(By.XPATH, ".//div[contains(@class, 'comparable-details')]/div")
                        for detail in details_elements:
                            detail_text = detail.text.lower()
                            
                            if 'bed' in detail_text:
                                try:
                                    comparable['beds'] = float(detail_text.split()[0])
                                except (ValueError, IndexError):
                                    pass
                            elif 'bath' in detail_text:
                                try:
                                    comparable['baths'] = float(detail_text.split()[0])
                                except (ValueError, IndexError):
                                    pass
                            elif 'sq ft' in detail_text or 'sqft' in detail_text:
                                try:
                                    sqft_text = detail_text.split()[0].replace(',', '')
                                    comparable['square_feet'] = int(sqft_text)
                                except (ValueError, IndexError):
                                    pass
                            elif 'year built' in detail_text:
                                try:
                                    comparable['year_built'] = int(detail_text.split(':')[1].strip())
                                except (ValueError, IndexError):
                                    pass
                            elif 'sold' in detail_text or 'sale date' in detail_text:
                                try:
                                    comparable['sale_date'] = detail_text.split(':')[1].strip()
                                except (IndexError):
                                    pass
                    except Exception as e:
                        logger.warning(f"Error extracting comparable details: {str(e)}")
                    
                    comparables_data.append(comparable)
                    
                except Exception as e:
                    logger.warning(f"Error extracting data from comparable: {str(e)}")
                    continue
            
            return comparables_data
            
        except TimeoutException:
            logger.error("Timed out waiting for comparable properties to load")
            return []
        except Exception as e:
            logger.error(f"Error scraping comparable properties: {str(e)}")
            return []
            
    def scrape_zip_market_activity(self, zip_code):
        """
        Scrape market activity data for a specific zip code.
        
        Args:
            zip_code (str): Zip code to scrape market activity for
            
        Returns:
            dict: Dictionary containing market activity data
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot scrape zip code market activity.")
            return {}
        
        try:
            logger.info(f"Navigating to market activity page for zip code: {zip_code}")
            self.driver.get(f"{self.base_url}/market-activity/zip/{zip_code}")
            
            # Wait for market data to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "market-stats"))
            )
            
            # Structure to store market activity data
            market_data = {
                'location_info': {
                    'type': 'zip',
                    'id': zip_code,
                    'name': zip_code
                },
                'market_stats': {}
            }
            
            # Get zip code name (city, state)
            try:
                location_element = self.driver.find_element(By.CLASS_NAME, "location-name")
                market_data['location_info']['name'] = location_element.text.strip()
            except NoSuchElementException:
                pass
                
            # Extract market statistics
            try:
                # Get median list price
                try:
                    list_price_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Median List Price')]")
                    price_text = list_price_element.text.split('\n')[1].replace('$', '').replace(',', '')
                    market_data['market_stats']['median_list_price'] = int(price_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get median sold price
                try:
                    sold_price_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Median Sold Price')]")
                    price_text = sold_price_element.text.split('\n')[1].replace('$', '').replace(',', '')
                    market_data['market_stats']['median_sold_price'] = int(price_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get median days on market
                try:
                    dom_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Median Days on Market')]")
                    dom_text = dom_element.text.split('\n')[1].split()[0]
                    market_data['market_stats']['median_days_on_market'] = int(dom_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get total properties
                try:
                    properties_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Total Properties')]")
                    properties_text = properties_element.text.split('\n')[1].replace(',', '')
                    market_data['market_stats']['total_properties'] = int(properties_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get active listings
                try:
                    active_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Active Listings')]")
                    active_text = active_element.text.split('\n')[1].replace(',', '')
                    market_data['market_stats']['active_listings'] = int(active_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get sold in last 6 months
                try:
                    sold_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Sold Last 6 Months')]")
                    sold_text = sold_element.text.split('\n')[1].replace(',', '')
                    market_data['market_stats']['sold_last_6_months'] = int(sold_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get price per sqft
                try:
                    sqft_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Price Per Sq Ft')]")
                    sqft_text = sqft_element.text.split('\n')[1].replace('$', '').replace(',', '')
                    market_data['market_stats']['price_per_sqft'] = int(sqft_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
            except Exception as e:
                logger.warning(f"Error extracting market statistics: {str(e)}")
                
            return market_data
            
        except TimeoutException:
            logger.error("Timed out waiting for market activity data to load")
            return {}
        except Exception as e:
            logger.error(f"Error scraping zip code market activity: {str(e)}")
            return {}
            
    def scrape_neighborhood_market_activity(self, neighborhood_id):
        """
        Scrape market activity data for a specific neighborhood.
        
        Args:
            neighborhood_id (str): Neighborhood ID to scrape market activity for
            
        Returns:
            dict: Dictionary containing market activity data
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot scrape neighborhood market activity.")
            return {}
        
        try:
            logger.info(f"Navigating to market activity page for neighborhood ID: {neighborhood_id}")
            self.driver.get(f"{self.base_url}/market-activity/neighborhood/{neighborhood_id}")
            
            # Wait for market data to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "market-stats"))
            )
            
            # Structure to store market activity data
            market_data = {
                'location_info': {
                    'type': 'neighborhood',
                    'id': neighborhood_id,
                    'name': ''
                },
                'market_stats': {}
            }
            
            # Get neighborhood name
            try:
                location_element = self.driver.find_element(By.CLASS_NAME, "location-name")
                market_data['location_info']['name'] = location_element.text.strip()
            except NoSuchElementException:
                pass
                
            # Extract market statistics (same as zip code method)
            try:
                # Get median list price
                try:
                    list_price_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Median List Price')]")
                    price_text = list_price_element.text.split('\n')[1].replace('$', '').replace(',', '')
                    market_data['market_stats']['median_list_price'] = int(price_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get median sold price
                try:
                    sold_price_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Median Sold Price')]")
                    price_text = sold_price_element.text.split('\n')[1].replace('$', '').replace(',', '')
                    market_data['market_stats']['median_sold_price'] = int(price_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get median days on market
                try:
                    dom_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Median Days on Market')]")
                    dom_text = dom_element.text.split('\n')[1].split()[0]
                    market_data['market_stats']['median_days_on_market'] = int(dom_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get total properties
                try:
                    properties_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Total Properties')]")
                    properties_text = properties_element.text.split('\n')[1].replace(',', '')
                    market_data['market_stats']['total_properties'] = int(properties_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get active listings
                try:
                    active_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Active Listings')]")
                    active_text = active_element.text.split('\n')[1].replace(',', '')
                    market_data['market_stats']['active_listings'] = int(active_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get sold in last 6 months
                try:
                    sold_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Sold Last 6 Months')]")
                    sold_text = sold_element.text.split('\n')[1].replace(',', '')
                    market_data['market_stats']['sold_last_6_months'] = int(sold_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
                    
                # Get price per sqft
                try:
                    sqft_element = self.driver.find_element(By.XPATH, "//div[contains(@class, 'stat-item') and contains(., 'Price Per Sq Ft')]")
                    sqft_text = sqft_element.text.split('\n')[1].replace('$', '').replace(',', '')
                    market_data['market_stats']['price_per_sqft'] = int(sqft_text)
                except (NoSuchElementException, IndexError, ValueError):
                    pass
            except Exception as e:
                logger.warning(f"Error extracting market statistics: {str(e)}")
                
            return market_data
            
        except TimeoutException:
            logger.error("Timed out waiting for market activity data to load")
            return {}
        except Exception as e:
            logger.error(f"Error scraping neighborhood market activity: {str(e)}")
            return {}
    
    def scrape_reports(self):
        """
        Navigate to the reports section and scrape report data.
        
        Returns:
            list: List of dictionaries containing report data
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot scrape reports.")
            return []
        
        try:
            logger.info("Navigating to reports section")
            self.driver.get(f"{self.base_url}/reports-v2")
            
            # Wait for reports to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "report-item"))
            )
            
            # Scrape report data
            reports_data = []
            report_items = self.driver.find_elements(By.CLASS_NAME, "report-item")
            
            logger.info(f"Found {len(report_items)} reports")
            
            for report in report_items:
                try:
                    report_data = {}
                    
                    # Extract report title and date
                    report_data['title'] = report.find_element(By.CLASS_NAME, "report-title").text
                    report_data['date'] = report.find_element(By.CLASS_NAME, "report-date").text
                    
                    # Try to extract additional details if available
                    try:
                        report_data['address'] = report.find_element(By.CLASS_NAME, "property-address").text
                    except NoSuchElementException:
                        report_data['address'] = "Not available"
                        
                    try:
                        report_data['price'] = report.find_element(By.CLASS_NAME, "property-price").text
                    except NoSuchElementException:
                        report_data['price'] = "Not available"
                    
                    reports_data.append(report_data)
                    
                except Exception as e:
                    logger.warning(f"Error extracting data from report: {str(e)}")
                    continue
            
            return reports_data
            
        except TimeoutException:
            logger.error("Timed out waiting for reports to load")
            return []
        except Exception as e:
            logger.error(f"Error scraping reports: {str(e)}")
            return []
    
    def navigate_to_property_details(self, property_id):
        """
        Navigate to a specific property details page and extract information.
        
        Args:
            property_id (str): The ID of the property to view
            
        Returns:
            dict: Dictionary containing property details
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot access property details.")
            return {}
        
        try:
            property_url = f"{self.base_url}/property/{property_id}"
            self.driver.get(property_url)
            
            # Wait for property details to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "property-details"))
            )
            
            # Extract property details
            property_data = {}
            property_data['property_id'] = property_id
            
            # Basic details
            property_data['address'] = self.driver.find_element(By.CLASS_NAME, "property-address").text
            property_data['price'] = self.driver.find_element(By.CLASS_NAME, "property-price").text
            
            # Additional details - adjust selectors as needed based on actual website structure
            details_section = self.driver.find_element(By.CLASS_NAME, "property-details")
            detail_items = details_section.find_elements(By.CLASS_NAME, "detail-item")
            
            for item in detail_items:
                try:
                    key = item.find_element(By.CLASS_NAME, "detail-label").text.strip(':')
                    value = item.find_element(By.CLASS_NAME, "detail-value").text
                    property_data[key] = value
                except Exception:
                    pass
                    
            # Extract more specific details if available
            try:
                property_data['bedrooms'] = self.driver.find_element(By.CLASS_NAME, "property-beds").text
            except NoSuchElementException:
                property_data['bedrooms'] = "N/A"
                
            try:
                property_data['bathrooms'] = self.driver.find_element(By.CLASS_NAME, "property-baths").text
            except NoSuchElementException:
                property_data['bathrooms'] = "N/A"
                
            try:
                property_data['square_feet'] = self.driver.find_element(By.CLASS_NAME, "property-sqft").text
            except NoSuchElementException:
                property_data['square_feet'] = "N/A"
                
            try:
                property_data['lot_size'] = self.driver.find_element(By.CLASS_NAME, "property-lot").text
            except NoSuchElementException:
                property_data['lot_size'] = "N/A"
                
            try:
                property_data['year_built'] = self.driver.find_element(By.CLASS_NAME, "property-year").text
            except NoSuchElementException:
                property_data['year_built'] = "N/A"
            
            return property_data
            
        except Exception as e:
            logger.error(f"Error navigating to property details: {str(e)}")
            return {}
            
    def scrape_market_activity(self, location_id=None, zip_code=None):
        """
        Scrape market activity data for a specific location or zip code.
        
        Args:
            location_id (str, optional): The location ID to view market activity for
            zip_code (str, optional): The zip code to view market activity for
            
        Returns:
            dict: Dictionary containing market activity data
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot access market activity.")
            return {}
        
        try:
            # Navigate to market activity page
            if location_id:
                market_url = f"{self.base_url}/market-activity/{location_id}"
            elif zip_code:
                market_url = f"{self.base_url}/market-activity?zip={zip_code}"
            else:
                logger.error("No location_id or zip_code provided for market activity")
                return {}
                
            self.driver.get(market_url)
            
            # Wait for market activity data to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CLASS_NAME, "market-data"))
            )
            
            # Extract market activity data
            market_data = {
                'location_id': location_id,
                'zip_code': zip_code,
                'timestamp': datetime.now().isoformat()
            }
            
            # Get market overview
            try:
                overview_section = self.driver.find_element(By.CLASS_NAME, "market-overview")
                market_data['median_list_price'] = overview_section.find_element(By.CLASS_NAME, "median-list-price").text
                market_data['median_sold_price'] = overview_section.find_element(By.CLASS_NAME, "median-sold-price").text
                market_data['price_per_sqft'] = overview_section.find_element(By.CLASS_NAME, "price-per-sqft").text
                market_data['days_on_market'] = overview_section.find_element(By.CLASS_NAME, "days-on-market").text
            except NoSuchElementException:
                logger.warning("Could not find market overview section")
            
            # Get listing trends
            try:
                trends_section = self.driver.find_element(By.CLASS_NAME, "listing-trends")
                market_data['active_listings'] = trends_section.find_element(By.CLASS_NAME, "active-count").text
                market_data['new_listings'] = trends_section.find_element(By.CLASS_NAME, "new-count").text
                market_data['pending_listings'] = trends_section.find_element(By.CLASS_NAME, "pending-count").text
                market_data['sold_listings'] = trends_section.find_element(By.CLASS_NAME, "sold-count").text
            except NoSuchElementException:
                logger.warning("Could not find listing trends section")
            
            # Get price trends
            try:
                price_trends = self.driver.find_element(By.CLASS_NAME, "price-trends")
                market_data['price_reduced'] = price_trends.find_element(By.CLASS_NAME, "price-reduced-count").text
                market_data['price_increased'] = price_trends.find_element(By.CLASS_NAME, "price-increased-count").text
                market_data['avg_price_reduction'] = price_trends.find_element(By.CLASS_NAME, "avg-reduction").text
            except NoSuchElementException:
                logger.warning("Could not find price trends section")
            
            return market_data
            
        except Exception as e:
            logger.error(f"Error scraping market activity: {str(e)}")
            return {}
            
    def scrape_neighborhood_data(self, neighborhood_id):
        """
        Scrape neighborhood data for a specific neighborhood ID.
        
        Args:
            neighborhood_id (str): The neighborhood ID to view data for
            
        Returns:
            dict: Dictionary containing neighborhood data
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot access neighborhood data.")
            return {}
        
        try:
            # Navigate to neighborhood page
            neighborhood_url = f"{self.base_url}/neighborhood/{neighborhood_id}"
            self.driver.get(neighborhood_url)
            
            # Wait for neighborhood data to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CLASS_NAME, "neighborhood-details"))
            )
            
            # Extract neighborhood data
            neighborhood_data = {
                'neighborhood_id': neighborhood_id,
                'timestamp': datetime.now().isoformat()
            }
            
            # Basic information
            try:
                neighborhood_data['name'] = self.driver.find_element(By.CLASS_NAME, "neighborhood-name").text
                neighborhood_data['location'] = self.driver.find_element(By.CLASS_NAME, "neighborhood-location").text
            except NoSuchElementException:
                logger.warning("Could not find basic neighborhood information")
            
            # Demographics
            try:
                demographics = self.driver.find_element(By.CLASS_NAME, "demographics")
                neighborhood_data['population'] = demographics.find_element(By.CLASS_NAME, "population").text
                neighborhood_data['median_age'] = demographics.find_element(By.CLASS_NAME, "median-age").text
                neighborhood_data['median_household_income'] = demographics.find_element(By.CLASS_NAME, "median-income").text
            except NoSuchElementException:
                logger.warning("Could not find demographics section")
            
            # Housing stats
            try:
                housing = self.driver.find_element(By.CLASS_NAME, "housing-stats")
                neighborhood_data['median_home_value'] = housing.find_element(By.CLASS_NAME, "median-value").text
                neighborhood_data['owner_occupied'] = housing.find_element(By.CLASS_NAME, "owner-occupied").text
                neighborhood_data['renter_occupied'] = housing.find_element(By.CLASS_NAME, "renter-occupied").text
            except NoSuchElementException:
                logger.warning("Could not find housing stats section")
            
            # Schools
            try:
                schools_section = self.driver.find_element(By.CLASS_NAME, "schools")
                schools = schools_section.find_elements(By.CLASS_NAME, "school-item")
                
                school_data = []
                for school in schools:
                    school_info = {}
                    school_info['name'] = school.find_element(By.CLASS_NAME, "school-name").text
                    school_info['type'] = school.find_element(By.CLASS_NAME, "school-type").text
                    school_info['rating'] = school.find_element(By.CLASS_NAME, "school-rating").text
                    school_data.append(school_info)
                
                neighborhood_data['schools'] = school_data
            except NoSuchElementException:
                logger.warning("Could not find schools section")
            
            return neighborhood_data
            
        except Exception as e:
            logger.error(f"Error scraping neighborhood data: {str(e)}")
            return {}
    
    def scrape_property_valuation(self, property_id):
        """
        Scrape property valuation data for a specific property.
        
        Args:
            property_id (str): The property ID to view valuation for
            
        Returns:
            dict: Dictionary containing property valuation data
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot access property valuation.")
            return {}
        
        try:
            # Navigate to property valuation page
            valuation_url = f"{self.base_url}/property/{property_id}/valuation"
            self.driver.get(valuation_url)
            
            # Wait for valuation data to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CLASS_NAME, "valuation-data"))
            )
            
            # Extract valuation data
            valuation_data = {
                'property_id': property_id,
                'timestamp': datetime.now().isoformat()
            }
            
            # RVM (Realtors Valuation Model)
            try:
                rvm_section = self.driver.find_element(By.CLASS_NAME, "rvm-valuation")
                valuation_data['rvm_value'] = rvm_section.find_element(By.CLASS_NAME, "rvm-value").text
                valuation_data['rvm_high'] = rvm_section.find_element(By.CLASS_NAME, "rvm-high").text
                valuation_data['rvm_low'] = rvm_section.find_element(By.CLASS_NAME, "rvm-low").text
                valuation_data['rvm_confidence'] = rvm_section.find_element(By.CLASS_NAME, "rvm-confidence").text
            except NoSuchElementException:
                logger.warning("Could not find RVM valuation section")
            
            # Historical values
            try:
                history_section = self.driver.find_element(By.CLASS_NAME, "value-history")
                history_items = history_section.find_elements(By.CLASS_NAME, "history-item")
                
                value_history = []
                for item in history_items:
                    history_point = {}
                    history_point['date'] = item.find_element(By.CLASS_NAME, "history-date").text
                    history_point['value'] = item.find_element(By.CLASS_NAME, "history-value").text
                    value_history.append(history_point)
                
                valuation_data['value_history'] = value_history
            except NoSuchElementException:
                logger.warning("Could not find value history section")
            
            # Tax assessment
            try:
                tax_section = self.driver.find_element(By.CLASS_NAME, "tax-assessment")
                valuation_data['tax_assessment'] = tax_section.find_element(By.CLASS_NAME, "assessment-value").text
                valuation_data['tax_assessment_year'] = tax_section.find_element(By.CLASS_NAME, "assessment-year").text
            except NoSuchElementException:
                logger.warning("Could not find tax assessment section")
            
            return valuation_data
            
        except Exception as e:
            logger.error(f"Error scraping property valuation: {str(e)}")
            return {}
            
    def scrape_comparable_properties(self, property_id):
        """
        Scrape comparable properties data for a specific property.
        
        Args:
            property_id (str): The property ID to view comparables for
            
        Returns:
            dict: Dictionary containing comparable properties data
        """
        if not self.check_login_status():
            logger.error("Not logged in. Cannot access comparable properties.")
            return {}
        
        try:
            # Navigate to comparable properties page
            comparables_url = f"{self.base_url}/property/{property_id}/comparables"
            self.driver.get(comparables_url)
            
            # Wait for comparables data to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CLASS_NAME, "comparables-list"))
            )
            
            # Extract comparables data
            comparables_data = {
                'property_id': property_id,
                'timestamp': datetime.now().isoformat(),
                'comparables': []
            }
            
            # Get comparable properties
            comparable_items = self.driver.find_elements(By.CLASS_NAME, "comparable-item")
            
            for item in comparable_items:
                comparable = {}
                
                try:
                    comparable['address'] = item.find_element(By.CLASS_NAME, "comp-address").text
                except NoSuchElementException:
                    comparable['address'] = "N/A"
                
                try:
                    comparable['price'] = item.find_element(By.CLASS_NAME, "comp-price").text
                except NoSuchElementException:
                    comparable['price'] = "N/A"
                
                try:
                    comparable['sale_date'] = item.find_element(By.CLASS_NAME, "comp-sale-date").text
                except NoSuchElementException:
                    comparable['sale_date'] = "N/A"
                
                try:
                    comparable['bedrooms'] = item.find_element(By.CLASS_NAME, "comp-beds").text
                except NoSuchElementException:
                    comparable['bedrooms'] = "N/A"
                
                try:
                    comparable['bathrooms'] = item.find_element(By.CLASS_NAME, "comp-baths").text
                except NoSuchElementException:
                    comparable['bathrooms'] = "N/A"
                
                try:
                    comparable['square_feet'] = item.find_element(By.CLASS_NAME, "comp-sqft").text
                except NoSuchElementException:
                    comparable['square_feet'] = "N/A"
                
                try:
                    comparable['distance'] = item.find_element(By.CLASS_NAME, "comp-distance").text
                except NoSuchElementException:
                    comparable['distance'] = "N/A"
                
                try:
                    comparable['similarity_score'] = item.find_element(By.CLASS_NAME, "comp-similarity").text
                except NoSuchElementException:
                    comparable['similarity_score'] = "N/A"
                
                comparables_data['comparables'].append(comparable)
            
            # Summary statistics
            try:
                summary = self.driver.find_element(By.CLASS_NAME, "comparables-summary")
                comparables_data['avg_price'] = summary.find_element(By.CLASS_NAME, "avg-price").text
                comparables_data['median_price'] = summary.find_element(By.CLASS_NAME, "median-price").text
                comparables_data['price_range'] = summary.find_element(By.CLASS_NAME, "price-range").text
                comparables_data['avg_price_per_sqft'] = summary.find_element(By.CLASS_NAME, "avg-price-sqft").text
            except NoSuchElementException:
                logger.warning("Could not find comparables summary section")
            
            return comparables_data
            
        except Exception as e:
            logger.error(f"Error scraping comparable properties: {str(e)}")
            return {}
    
    def save_to_csv(self, data, filename="narrpr_data.csv"):
        """
        Save scraped data to a CSV file.
        
        Args:
            data (list): List of dictionaries containing scraped data
            filename (str): Name of the CSV file to save
            
        Returns:
            str: Path to the saved CSV file
        """
        if not data:
            logger.warning("No data to save to CSV")
            return None
        
        try:
            # Create directory if it doesn't exist
            output_dir = "output"
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            file_path = os.path.join(output_dir, filename)
            
            # Convert data to DataFrame and save to CSV
            df = pd.DataFrame(data)
            df.to_csv(file_path, index=False)
            
            logger.info(f"Data saved to {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Error saving data to CSV: {str(e)}")
            return None
    
    def close(self):
        """Close the WebDriver and cleanup resources."""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("WebDriver closed successfully")
            except Exception as e:
                logger.error(f"Error closing WebDriver: {str(e)}")
