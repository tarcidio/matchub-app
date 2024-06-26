import {
  ChangeDetectorRef,
  ViewChild,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { HubUserDetails } from '../../../../shared/classes/dto/hub-user/hub-user-details/hub-user-details';
import { Observable, Subject, map, of, switchMap, take, takeUntil } from 'rxjs';
import { HubUserService } from '../../../shared/services/hub-user/hub-user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../auth/shared/service/auth.service';
import { HubUserBase } from '../../../../shared/classes/dto/hub-user/hub-user-base/hub-user-base';
import { ChangePassword } from '../../../../shared/classes/auth/change-password/change-password';
import { ModalUpdateComponent } from '../../../../shared/modal/modal-update/modal-update.component';
import { HubUserLinks } from '../../../../shared/classes/dto/hub-user/hub-user-links/hub-user-links';
import { ModalExitComponent } from '../../../../shared/modal/modal-exit/modal-exit/modal-exit.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild(ModalUpdateComponent) modalUpdate:
    | ModalUpdateComponent
    | undefined;
  @ViewChild(ModalExitComponent) modalExit: ModalExitComponent | undefined;

  private destroy$ = new Subject<void>();

  constructor(
    private hubUserService: HubUserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  hubUserImg$: Observable<string> | undefined;

  ngOnInit(): void {
    this.hubUserService
      .getLoggedHubUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    this.loadInitialData();
    this.hubUserImg$ = this.hubUserService.getImgLoggedHubUser();
  }

  ngOnDestroy(): void {
    // Complete the destroy$ subject to clean up the subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData() {
    this.hubUserService.getHubUser().subscribe({
      next: (hubUser) => {
        if (hubUser) {
          this.formPersonalInformation.patchValue({
            firstName: hubUser.firstname,
            lastName: hubUser.lastname,
            email: '',
          });

          this.formUserInformation.patchValue({ nickName: hubUser.nickname });
        }
      },
    });
  }

  public get username$() {
    return this.hubUserService.getUserNameHubUser();
  }

  public get email$(): Observable<string> {
    return this.hubUserService
      .getEmailHubUser()
      .pipe(map((email) => this.maskEmail(email)));
  }

  private maskEmail(email: string): string {
    const atPosition = email.indexOf('@');

    // Verifica se o '@' foi encontrado e se há pelo menos três caracteres antes dele
    if (atPosition === -1 || atPosition < 3) {
      return email;
    }

    // Mantém os três primeiros caracteres, substitui o restante antes do '@' por asteriscos
    const maskedSection = '*'.repeat(atPosition - 3);
    return `${email.substring(0, 3)}${maskedSection}${email.substring(
      atPosition
    )}`;
  }

  /* MANAGE UPDATES */
  private updateHubUser(
    newNickName?: string,
    newFirstName?: string,
    newLastName?: string,
    newEmail?: string
  ): Observable<HubUserLinks> {
    return this.hubUserService.getHubUser().pipe(
      take(1), // Avoid recursion
      map((hubUser: HubUserDetails) => {
        return new HubUserBase(
          newNickName || hubUser.nickname,
          newFirstName || hubUser.firstname,
          newLastName || hubUser.lastname,
          newEmail || hubUser.email,
          hubUser.region
        );
      }),
      switchMap((hubUser: HubUserBase) =>
        this.hubUserService.updateHubUser(hubUser)
      )
    );
  }

  formUserInformation: FormGroup = this.fb.group({
    nickName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(15)],
    ],
  });

  public updateUserInformation(): void {
    if (this.formUserInformation.valid) {
      let newNickName: string | undefined =
        this.formUserInformation.get('nickName')?.value;
      let newFirstName: string | undefined = undefined;
      let newLastName: string | undefined = undefined;
      let newEmail: string | undefined = undefined;
      this.updateHubUser(
        newNickName,
        newFirstName,
        newLastName,
        newEmail
      ).subscribe({
        next: () => {
          this.modalUpdate!.activateModalUpdate(
            'Change Made',
            'Your information has been updated successfully',
            'main/profile',
            'Back to Profile'
          );
        },
        error: (err) => {
          this.modalUpdate!.activateModalUpdate(
            'Error updating information',
            err.message,
            'main/profile',
            'Back to Profile'
          );
        },
      });
    } else {
      this.modalUpdate!.activateModalUpdate(
        'Error updating information',
        'Please choose a valid nickname (2-15 characters).',
        'main/profile',
        'Back to Profile'
      );
    }
  }

  formPersonalInformation: FormGroup = this.fb.group({
    email: ['', Validators.email],
    firstName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(30)],
    ],
    lastName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(30)],
    ],
  });

  get firstNameInvalid() {
    const control = this.formPersonalInformation.get('firstName');
    return control?.errors;
  }

  get lastNameInvalid() {
    const control = this.formPersonalInformation.get('lastName');
    return control?.errors;
  }

  get emailInvalid() {
    const control = this.formPersonalInformation.get('email');
    return control?.hasError('email');
  }

  public updatePersonalInformation(): void {
    if (this.formPersonalInformation.valid) {
      let newNickName: string | undefined = undefined;
      let newFirstName: string | undefined =
        this.formPersonalInformation.get('firstName')?.value;
      let newLastName: string | undefined =
        this.formPersonalInformation.get('lastName')?.value;
      let newEmail: string | undefined =
        this.formPersonalInformation.get('email')?.value;
      this.updateHubUser(newNickName, newFirstName, newLastName, newEmail);
    } else {
      if (this.emailInvalid)
        this.modalUpdate!.activateModalUpdate(
          'Error updating information',
          'Please choose a valid nickname (2-15 characters).',
          'main/profile',
          'Back to Profile'
        );
      else if (this.lastNameInvalid)
        this.modalUpdate!.activateModalUpdate(
          'Error updating information',
          'Please enter a valid last name (2-30 characters).',
          'main/profile',
          'Back to Profile'
        );
      else if (this.firstNameInvalid)
        this.modalUpdate!.activateModalUpdate(
          'Error updating information',
          'Please enter a valid first name (2-30 characters).',
          'main/profile',
          'Back to Profile'
        );
    }
  }

  invalidChnagePassword: boolean = false;
  formChangePassword: FormGroup = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  get passwordInvalid() {
    const control = this.formChangePassword.get('newPassword');

    if (!control) return false;

    const isNull = !control.value;
    const hasUpperCase = !isNull && /[A-Z]+/.test(control.value);
    const hasLowerCase = !isNull && /[a-z]+/.test(control.value);
    const hasNumeric = !isNull && /[0-9]+/.test(control.value);
    const hasSpecial = !isNull && /[!@#$%^&*(),.?":{}|<>]+/.test(control.value);
    const isStrong = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;

    return control?.errors || !isStrong;
  }

  get confirmPasswordInvalid() {
    const controlConfirm = this.formChangePassword.get('confirmPassword');
    const controlPassword = this.formChangePassword.get('newPassword');

    if (!controlConfirm || !controlPassword) return false;

    const isRequiredError =
      controlConfirm.hasError('required') ||
      controlPassword.hasError('required');
    const isEqualPassword =
      !controlConfirm.value ||
      !controlPassword.value ||
      controlConfirm.value !== controlPassword.value;

    return isEqualPassword || isRequiredError;
  }

  public changePassword(): void {
    if (this.passwordInvalid) {
      this.modalUpdate!.activateModalUpdate(
        'Error updating information',
        'Password must include uppercase, lowercase, number, special character, and be at least 8 characters long.',
        'main/profile',
        'Back to Profile'
      );
    } else if (this.confirmPasswordInvalid) {
      this.modalUpdate!.activateModalUpdate(
        'Error updating information',
        'Password confirmation does not match the password.',
        'main/profile',
        'Back to Profile'
      );
    } else if (this.formChangePassword.valid) {
      let currentPassword: string =
        this.formChangePassword.get('oldPassword')?.value;
      let newPassword: string =
        this.formChangePassword.get('newPassword')?.value;
      let confirmationPassword: string =
        this.formChangePassword.get('confirmPassword')?.value;
      this.hubUserService
        .changePassword(
          new ChangePassword(currentPassword, newPassword, confirmationPassword)
        )
        .subscribe({
          next: () => {
            this.modalUpdate!.activateModalUpdate(
              'Change Made',
              'Your information has been updated successfully',
              'main/profile',
              'Back to Profile'
            );
          },
          error: (err) => {
            this.modalUpdate!.activateModalUpdate(
              'Error updating information',
              err.massage,
              'main/profile',
              'Back to Profile'
            );
          },
        });
    } else {
      this.modalUpdate!.activateModalUpdate(
        'Error updating information',
        'Unexpected error.',
        'main/profile',
        'Back to Profile'
      );
    }
  }

  public confirmExit(): void {
    let executeExit : Function = () => this.authService.logout().subscribe();
    this.modalExit!.activateModalExit(executeExit);
  }

  // Uplado img

  previewImgSrc: string | ArrayBuffer | null = null;
  imgSrc: File | undefined;

  hover: boolean = false;
  isModalUpload: boolean = false;
  isErrorType: boolean = false;

  public activateModalUpload(): void {
    this.isModalUpload = true;
    this.previewImgSrc = null;
    this.imgSrc = undefined;
  }

  public disableModalUpload(): void {
    this.isModalUpload = false;
    this.previewImgSrc = null;
    this.imgSrc = undefined;
  }

  public handleFileInput(event: Event): void {
    /* `event.target.files`:
    event.target: HTML element that triggered the event (in this case it is an `<input type="file">`).
    event.target.files: `files` property is a list of files selected by the user
    */
    const inputElement = event.target as HTMLInputElement;
    let files = inputElement.files;

    // If `files` exists and its quantity is greater than zero, it means that at least one file was selected.
    if (files && files.length > 0) {
      // Only the first file is being manipulated, even though the user can select multiple files.
      const file = files[0];
      this.imgSrc = file;

      if (!file.name.endsWith('.jpg')) {
        this.isErrorType = true;
        this.previewImgSrc = null;
        this.imgSrc = undefined;
      } else {
        /*
        `FileReader` is a JavaScript API that allows web applications to read files 
        (or buffered information) stored on the client asynchronously
        */
        const reader = new FileReader();

        /*
        reader.onload: defines a function that will be executed when `FileReader` finishes reading the file
        e: event that contains the reading results e.target.result: data from the read file
        */
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.previewImgSrc = e.target!.result;
        };

        //reader.readAsDataURL: method reads the contents of the `file` and converts it to a data URL (base64)
        reader.readAsDataURL(file);
      }
    }
  }

  public uploadImg() {
    if (this.imgSrc && this.imgSrc instanceof File) {
      this.hubUserService.upload(this.imgSrc).subscribe({
        next: () => {
          this.disableModalUpload();
          this.modalUpdate!.activateModalUpdate(
            'Change Made',
            'Your information has been updated successfully',
            'main/profile',
            'Back to Profile'
          );
        },
        error: (err) => {
          this.disableModalUpload();
          this.modalUpdate!.activateModalUpdate(
            'Error updating information',
            err.massage,
            'main/profile',
            'Back to Profile'
          );
        },
      });
    } else {
      this.disableModalUpload();
      this.modalUpdate!.activateModalUpdate(
        'Error updating information',
        'No image found',
        'main/profile',
        'Back to Profile'
      );
    }
  }
}
