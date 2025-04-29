import NavigationComponent from '../../components/NavigationComponent/NavigationComponent'
import AccountComponent from './Components/AccountComponent';
import PasswordComponent from './Components/PasswordComponent';
import NotificationsComponent from './Components/NotificationsComponent';



const Settings = () => {

    const myTabData1 = [
        { label: 'Account', content: <AccountComponent/> },
        { label: 'Password', content: <PasswordComponent /> },
        { label: 'Notifications', content: <NotificationsComponent/> },
      ];

  return (
    <div className='w-full h-full overflow-y-scroll flex-col flex gap-3 p-10'>
        <h1 className="font-bold text-3xl max-sm:text-2xl mb-2">Settings</h1>
        <NavigationComponent tabData={myTabData1}/>
    </div>  
  )
}

export default Settings